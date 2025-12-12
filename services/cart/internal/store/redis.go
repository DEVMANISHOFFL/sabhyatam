package store

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/devmanishoffl/sabhyatam-cart/internal/model"
	"github.com/redis/go-redis/v9"
)

type RedisStore struct {
	cli      *redis.Client
	ttlUser  time.Duration
	ttlGuest time.Duration
}

func NewRedisFromEnv() (*RedisStore, error) {
	addr := os.Getenv("REDIS_ADDR")
	pass := os.Getenv("REDIS_PASSWORD")
	if addr == "" {
		addr = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: pass,
		DB:       0,
	})

	// ping
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		return nil, err
	}

	// TTLs
	userDays := 30
	guestDays := 7
	if v := os.Getenv("CART_TTL_USER_DAYS"); v != "" {
		fmt.Sscanf(v, "%d", &userDays)
	}
	if v := os.Getenv("CART_TTL_GUEST_DAYS"); v != "" {
		fmt.Sscanf(v, "%d", &guestDays)
	}

	return &RedisStore{
		cli:      rdb,
		ttlUser:  time.Hour * 24 * time.Duration(userDays),
		ttlGuest: time.Hour * 24 * time.Duration(guestDays),
	}, nil
}

// key helpers
func userKey(userID string) string  { return "cart:user:" + userID }
func guestKey(sessID string) string { return "cart:guest:" + sessID }

// SetItem - upsert quantity (overwrites)
func (r *RedisStore) SetItem(ctx context.Context, key, variantID string, item model.CartItem) error {
	b, _ := json.Marshal(item)
	if err := r.cli.HSet(ctx, key, variantID, b).Err(); err != nil {
		return err
	}
	// refresh TTL
	if isUserKey(key) {
		return r.cli.Expire(ctx, key, r.ttlUser).Err()
	}
	return r.cli.Expire(ctx, key, r.ttlGuest).Err()
}

func (r *RedisStore) DeleteItem(ctx context.Context, key, variantID string) error {
	return r.cli.HDel(ctx, key, variantID).Err()
}

func (r *RedisStore) GetAll(ctx context.Context, key string) ([]model.CartItem, error) {
	res, err := r.cli.HGetAll(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, err
	}
	out := make([]model.CartItem, 0, len(res))
	for _, v := range res {
		var it model.CartItem
		_ = json.Unmarshal([]byte(v), &it)
		out = append(out, it)
	}
	return out, nil
}

func (r *RedisStore) Merge(ctx context.Context, targetKey, srcKey string) error {
	// simple merge: for each item in src -> set into target (overwrite quantity-add)
	src, err := r.cli.HGetAll(ctx, srcKey).Result()
	if err != nil {
		return err
	}
	for field, val := range src {
		var it model.CartItem
		if err := json.Unmarshal([]byte(val), &it); err != nil {
			continue
		}
		// if exists in target, sum quantities
		tgtVal, _ := r.cli.HGet(ctx, targetKey, field).Result()
		if tgtVal != "" {
			var existing model.CartItem
			_ = json.Unmarshal([]byte(tgtVal), &existing)
			it.Quantity = existing.Quantity + it.Quantity
		}
		b, _ := json.Marshal(it)
		if err := r.cli.HSet(ctx, targetKey, field, b).Err(); err != nil {
			return err
		}
	}
	// delete src key
	return r.cli.Del(ctx, srcKey).Err()
}

func isUserKey(k string) bool {
	return len(k) > 10 && k[:10] == "cart:user:"
}
