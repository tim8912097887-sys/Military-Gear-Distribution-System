CREATE TABLE "distribution_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservist_id" uuid NOT NULL,
	"inventory_item_id" uuid,
	"serialized_item_id" uuid,
	"action_type" varchar(20) NOT NULL,
	"quantity" integer,
	"request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "distribution_action_check" CHECK ("distribution_logs"."action_type" IN ('ISSUE', 'RETURN')),
	CONSTRAINT "distribution_logs_target_check" CHECK (("distribution_logs"."inventory_item_id" IS NOT NULL AND "distribution_logs"."serialized_item_id" IS NULL AND "distribution_logs"."quantity" IS NOT NULL AND "distribution_logs"."quantity" > 0)
          OR ("distribution_logs"."inventory_item_id" IS NULL AND "distribution_logs"."serialized_item_id" IS NOT NULL AND "distribution_logs"."quantity" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "gear_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"tracking_type" varchar(20) NOT NULL,
	"max_per_reservist" integer NOT NULL,
	"requires_size" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gear_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "gear_tracking_type_check" CHECK ("gear_categories"."tracking_type" IN ('BULK', 'SERIALIZED')),
	CONSTRAINT "gear_max_per_reservist_positive" CHECK ("gear_categories"."max_per_reservist" > 0)
);
--> statement-breakpoint
CREATE TABLE "reservists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"national_id" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"military_rank" varchar(50) NOT NULL,
	"checked_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservists_national_id_unique" UNIQUE("national_id"),
	CONSTRAINT "reservists_national_id_format" CHECK ("reservists"."national_id" ~ '^[A-Z][0-9A-D][0-9]{8}$')
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"size" varchar(20),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_category_size_key" UNIQUE("category_id","size"),
	CONSTRAINT "stock_non_negative" CHECK ("inventory_items"."stock_quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "serialized_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"size" varchar(20),
	"status" varchar(20) DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "serialized_items_serial_number_unique" UNIQUE("serial_number"),
	CONSTRAINT "serialized_item_status_check" CHECK ("serialized_items"."status" IN ('AVAILABLE', 'ISSUED', 'MAINTENANCE', 'LOST'))
);
--> statement-breakpoint
CREATE TABLE "reservist_bulk_gear" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservist_id" uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservist_bulk_gear_unique" UNIQUE("reservist_id","inventory_item_id"),
	CONSTRAINT "positive_quantity" CHECK ("reservist_bulk_gear"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "reservist_serialized_gear" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservist_id" uuid NOT NULL,
	"serialized_item_id" uuid NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"returned_at" timestamp with time zone,
	CONSTRAINT "returned_after_issued" CHECK ("reservist_serialized_gear"."returned_at" IS NULL OR "reservist_serialized_gear"."returned_at" >= "reservist_serialized_gear"."issued_at")
);
--> statement-breakpoint
ALTER TABLE "distribution_logs" ADD CONSTRAINT "distribution_logs_reservist_id_reservists_id_fk" FOREIGN KEY ("reservist_id") REFERENCES "public"."reservists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_logs" ADD CONSTRAINT "distribution_logs_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_logs" ADD CONSTRAINT "distribution_logs_serialized_item_id_serialized_items_id_fk" FOREIGN KEY ("serialized_item_id") REFERENCES "public"."serialized_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_category_id_gear_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."gear_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serialized_items" ADD CONSTRAINT "serialized_items_category_id_gear_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."gear_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservist_bulk_gear" ADD CONSTRAINT "reservist_bulk_gear_reservist_id_reservists_id_fk" FOREIGN KEY ("reservist_id") REFERENCES "public"."reservists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservist_bulk_gear" ADD CONSTRAINT "reservist_bulk_gear_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservist_serialized_gear" ADD CONSTRAINT "reservist_serialized_gear_reservist_id_reservists_id_fk" FOREIGN KEY ("reservist_id") REFERENCES "public"."reservists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservist_serialized_gear" ADD CONSTRAINT "reservist_serialized_gear_serialized_item_id_serialized_items_id_fk" FOREIGN KEY ("serialized_item_id") REFERENCES "public"."serialized_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_distribution_logs_reservist_created" ON "distribution_logs" USING btree ("reservist_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_serialized_category_status_size" ON "serialized_items" USING btree ("category_id","status","size");--> statement-breakpoint
CREATE INDEX "idx_bulk_gear_reservist" ON "reservist_bulk_gear" USING btree ("reservist_id");--> statement-breakpoint
CREATE INDEX "idx_bulk_gear_inventory_item" ON "reservist_bulk_gear" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_serialized_gear_reservist" ON "reservist_serialized_gear" USING btree ("reservist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_active_serialized_item" ON "reservist_serialized_gear" USING btree ("serialized_item_id") WHERE "reservist_serialized_gear"."returned_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_serialized_gear_open_by_reservist" ON "reservist_serialized_gear" USING btree ("reservist_id","serialized_item_id") WHERE "reservist_serialized_gear"."returned_at" IS NULL;