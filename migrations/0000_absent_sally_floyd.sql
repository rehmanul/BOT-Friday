CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"campaign_id" integer,
	"type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "browser_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_data" jsonb,
	"is_active" boolean DEFAULT false,
	"last_activity" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invitation_text" text,
	"sent_at" timestamp,
	"responded_at" timestamp,
	"response_text" text,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"target_invitations" integer NOT NULL,
	"daily_limit" integer DEFAULT 20 NOT NULL,
	"invitation_template" text NOT NULL,
	"human_like_delays" boolean DEFAULT true,
	"ai_optimization" boolean DEFAULT true,
	"filters" jsonb,
	"sent_count" integer DEFAULT 0,
	"response_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"followers" integer,
	"category" text,
	"engagement_rate" numeric(5, 2),
	"gmv" numeric(12, 2),
	"profile_data" jsonb,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "creators_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(100),
	"profile_picture" varchar(500),
	"tiktok_session" jsonb,
	"settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "browser_sessions" ADD CONSTRAINT "browser_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_invitations" ADD CONSTRAINT "campaign_invitations_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;