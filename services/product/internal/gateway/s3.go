package gateway

import (
	"context"
	"log"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Gateway struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	Bucket        string
}

func NewS3Gateway(bucket string) *S3Gateway {
	// Load default config (reads from ENV vars automatically)
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	client := s3.NewFromConfig(cfg)

	return &S3Gateway{
		client:        client,
		presignClient: s3.NewPresignClient(client),
		Bucket:        bucket,
	}
}

func (s *S3Gateway) GenerateUploadURL(key string, contentType string) (string, error) {
	req, err := s.presignClient.PresignPutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(s.Bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, func(opts *s3.PresignOptions) {
		opts.Expires = 15 * time.Minute
	})

	if err != nil {
		return "", err
	}

	return req.URL, nil
}
