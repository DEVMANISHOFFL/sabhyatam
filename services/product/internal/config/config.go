package config

import "os"

type Config struct {
	DatabaseURL string
	Port        int
}

func LoadFromEnv() *Config {
	port := 8080
	if v := os.Getenv("PRODUCTSVC_PORT"); v != "" {
	}
	db := os.Getenv("DATABASE_URL")
	if db == "" {
		db = "postgres://postgres:postgres@postgres:5432/sabhyatam?sslmode=disable"
	}
	return &Config{
		DatabaseURL: db,
		Port:        port,
	}
}
