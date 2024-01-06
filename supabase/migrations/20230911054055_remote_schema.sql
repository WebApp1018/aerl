
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";

CREATE SCHEMA IF NOT EXISTS "docs";

ALTER SCHEMA "docs" OWNER TO "postgres";

CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_hashids" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_jsonschema" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";

-- May need to be added in some cases when seeding a new development environment.
-- CREATE ROLE device;

CREATE TYPE "public"."continents" AS ENUM (
    'Africa',
    'Antarctica',
    'Asia',
    'Europe',
    'Oceania',
    'North America',
    'South America'
);

ALTER TYPE "public"."continents" OWNER TO "postgres";

CREATE TYPE "public"."severity" AS ENUM (
    'information',
    'warning',
    'error'
);

ALTER TYPE "public"."severity" OWNER TO "postgres";

CREATE TYPE "public"."user_role" AS ENUM (
    'owner',
    'admin',
    'editor',
    'viewer'
);

ALTER TYPE "public"."user_role" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."add_owner_to_org_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  INSERT INTO org_member (org_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner'::user_role);

  RETURN NEW;
END;$$;

ALTER FUNCTION "public"."add_owner_to_org_member"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."assert_created_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  NEW.created_at = now();
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."assert_created_at"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."check_org_membership"("org_id" bigint, "user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$BEGIN
  RETURN EXISTS (SELECT 1 FROM org_member WHERE org_member.user_id = check_org_membership.user_id AND org_member.org_id = check_org_membership.org_id);
END;$$;

ALTER FUNCTION "public"."check_org_membership"("org_id" bigint, "user_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."check_user_access"("user_id" "uuid", "required_role" "public"."user_role") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role
  FROM org_member
  WHERE org_member.user_id = check_user_access.user_id;

  IF user_role = 'owner' AND required_role = 'owner' THEN
    RETURN TRUE;
  ELSIF user_role IN ('admin', 'owner') AND required_role = 'admin' THEN
    RETURN TRUE;
  ELSIF user_role IN ('editor', 'admin', 'owner') AND required_role = 'editor' THEN
    RETURN TRUE;
  ELSIF user_role IN ('viewer', 'editor', 'admin', 'owner') AND required_role = 'viewer' THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

ALTER FUNCTION "public"."check_user_access"("user_id" "uuid", "required_role" "public"."user_role") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."check_user_access"("user_id" "uuid", "org_id" bigint, "required_role" "public"."user_role") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT org_member.role INTO user_role
  FROM org_member
  WHERE (org_member.user_id = check_user_access.user_id) AND (org_member.org_id = check_user_access.org_id);

  IF user_role = 'owner' AND required_role = 'owner' THEN
    RETURN TRUE;
  ELSIF user_role IN ('admin', 'owner') AND required_role = 'admin' THEN
    RETURN TRUE;
  ELSIF user_role IN ('editor', 'admin', 'owner') AND required_role = 'editor' THEN
    RETURN TRUE;
  ELSIF user_role IN ('viewer', 'editor', 'admin', 'owner') AND required_role = 'viewer' THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

ALTER FUNCTION "public"."check_user_access"("user_id" "uuid", "org_id" bigint, "required_role" "public"."user_role") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."check_user_current_org"("user_jwt" "jsonb", "org_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$DECLARE
    user_org_id int8;
    jwt_user_id uuid;
BEGIN
    -- Extract the org ID from the JWT token
    SELECT (((user_jwt -> 'user_metadata'::text) -> 'org'::text -> 'id'::text))::bigint INTO user_org_id;

    -- Check if the user has the correct org selected
    IF user_org_id = org_id THEN
        -- Extract the user ID from the JWT token
        SELECT (user_jwt->>'sub'::text)::uuid INTO jwt_user_id;

        -- Check if the user has an entry for that org in the org_member table
        RETURN EXISTS (
            SELECT 1
            FROM org_member
            WHERE org_member.user_id = jwt_user_id
            AND org_member.org_id = check_user_current_org.org_id
        );
    END IF;

    RETURN FALSE;
END;$$;

ALTER FUNCTION "public"."check_user_current_org"("user_jwt" "jsonb", "org_id" bigint) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."enhance_org_member_select"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  user_info RECORD;
BEGIN
  SELECT *
  INTO user_info
  FROM get_user_info(NEW.user_id);

  NEW.name := user_info.name;
  NEW.email := user_info.email;
END;$$;

ALTER FUNCTION "public"."enhance_org_member_select"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_org_users"() RETURNS TABLE("id" "uuid", "role" "public"."user_role", "email" character varying, "name" "text")
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT u.id as id, m.role as role, u.email as email, u.raw_user_meta_data->>'name' as name
  FROM auth.users u
  JOIN org_member m ON u.id = m.user_id
  WHERE check_org_membership(m.org_id, auth.uid()) AND (((((auth.jwt() -> 'user_metadata'::text) -> 'org'::text) -> 'id'::text))::bigint = org_id)
$$;

ALTER FUNCTION "public"."get_org_users"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_user_info"("subject_user_id" "uuid") RETURNS TABLE("id" "uuid", "email" character varying, "name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
    SELECT users.id, users.email as email, users.raw_user_meta_data->>'name' as name
    FROM auth.users
    WHERE users.id = subject_user_id AND
      EXISTS (SELECT 1
      FROM org_member AS om1
      JOIN org_member AS om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = auth.uid() AND om2.user_id = get_user_info.subject_user_id);
END;
$$;

ALTER FUNCTION "public"."get_user_info"("subject_user_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."hub_encrypt_secret_root_password"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
		BEGIN
		        new.root_password = CASE WHEN new.root_password IS NULL THEN NULL ELSE
			CASE WHEN '66e7550a-f337-411f-a49c-8c62de4573e5' IS NULL THEN NULL ELSE pg_catalog.encode(
			  pgsodium.crypto_aead_det_encrypt(
				pg_catalog.convert_to(new.root_password, 'utf8'),
				pg_catalog.convert_to(('')::text, 'utf8'),
				'66e7550a-f337-411f-a49c-8c62de4573e5'::uuid,
				NULL
			  ),
				'base64') END END;
		RETURN new;
		END;
		$$;

ALTER FUNCTION "public"."hub_encrypt_secret_root_password"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."is_valid_abn"("abn_input" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    ABN_MAX_CHARS constant int := 14;
    ABN_DIGITS constant int := 11;
    WEIGHTING constant int[] := '{10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19}';
    MODULUS constant int := 89;

    abn text;
    temp_abn int[];
    remainder int;
    i int;
BEGIN
    abn := regexp_replace(abn_input, '\D', '', 'g');

    IF length(abn) > ABN_MAX_CHARS THEN
        RETURN FALSE;
    END IF;

    abn := replace(abn, ' ', '');

    IF length(abn) != ABN_DIGITS OR substr(abn, 1, 1) = '0' THEN
        RETURN FALSE;
    END IF;

    temp_abn := '{}'::int[];
    FOR i IN 1..ABN_DIGITS LOOP
        temp_abn := temp_abn || substr(abn, i, 1)::int;
    END LOOP;

    temp_abn[1] := temp_abn[1] - 1;
    remainder := 0;
    FOR i IN 1..ABN_DIGITS LOOP
        remainder := remainder + (temp_abn[i] * WEIGHTING[i]);
    END LOOP;

    remainder := remainder % MODULUS;

    IF remainder != 0 THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

ALTER FUNCTION "public"."is_valid_abn"("abn_input" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."alert" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" bigint NOT NULL,
    "metadata" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone
);

ALTER TABLE "public"."alert" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."alert_receiver" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."alert_receiver" OWNER TO "postgres";

ALTER TABLE "public"."alert_receiver" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."alert_receiver_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."alert_rule" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" bigint NOT NULL,
    "rule" "jsonb" NOT NULL,
    "applied_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "alert_rule_rule_check" CHECK ("extensions"."jsonb_matches_schema"('{"type":"object","properties":{"alert":{"type":"string"},"expr":{"type":"string"},"for":{"type":"string"},"labels":{"type":"object","additionalProperties":{"type":"string"}},"annotations":{"type":"object","additionalProperties":{"type":"string"}}},"required":["alert","expr","for"],"additionalProperties":false}'::"json", "rule"))
);

ALTER TABLE "public"."alert_rule" OWNER TO "postgres";

ALTER TABLE "public"."alert_rule" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."alert_rule_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."country" (
    "id" bigint NOT NULL,
    "name" "text",
    "iso2" "text" NOT NULL,
    "iso3" "text",
    "local_name" "text",
    "continent" "public"."continents"
);

ALTER TABLE "public"."country" OWNER TO "postgres";

ALTER TABLE "public"."country" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."countries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."hub" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "machine_id" "text" NOT NULL,
    "machine_secret_hash" "text" NOT NULL,
    "pin" "text" NOT NULL,
    "root_password" "text",
    CONSTRAINT "hub_id_check" CHECK (("length"("id") <= 8))
);

ALTER TABLE "public"."hub" OWNER TO "postgres";

SECURITY LABEL FOR "pgsodium" ON COLUMN "public"."hub"."root_password" IS 'ENCRYPT WITH KEY ID 66e7550a-f337-411f-a49c-8c62de4573e5';

CREATE OR REPLACE VIEW "public"."decrypted_hub" AS
 SELECT "hub"."id",
    "hub"."created_at",
    "hub"."machine_id",
    "hub"."machine_secret_hash",
    "hub"."pin",
    "hub"."root_password",
        CASE
            WHEN ("hub"."root_password" IS NULL) THEN NULL::"text"
            ELSE
            CASE
                WHEN ('66e7550a-f337-411f-a49c-8c62de4573e5' IS NULL) THEN NULL::"text"
                ELSE "convert_from"("pgsodium"."crypto_aead_det_decrypt"("decode"("hub"."root_password", 'base64'::"text"), "convert_to"(''::"text", 'utf8'::"name"), '66e7550a-f337-411f-a49c-8c62de4573e5'::"uuid", NULL::"bytea"), 'utf8'::"name")
            END
        END AS "decrypted_root_password"
   FROM "public"."hub";

ALTER TABLE "public"."decrypted_hub" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."device" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen" timestamp with time zone,
    "org_id" bigint NOT NULL,
    "hub_id" "text" NOT NULL,
    "notes" "text",
    "name" "text",
    "coordinate" "point",
    "key" "text" GENERATED ALWAYS AS ("extensions"."id_encode"("id", ''::"text", 4)) STORED,
    "location_id" bigint,
    CONSTRAINT "device_name_check" CHECK (("length"("name") < 200)),
    CONSTRAINT "device_notes_check" CHECK (("length"("notes") < 1000))
);

ALTER TABLE "public"."device" OWNER TO "postgres";

ALTER TABLE "public"."device" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."device_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."instance" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stub" "text" NOT NULL,
    "domain" "text",
    CONSTRAINT "instance_stub_check" CHECK (("length"("stub") < 20))
);

ALTER TABLE "public"."instance" OWNER TO "postgres";

ALTER TABLE "public"."instance" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."instance_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."location" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "org_id" bigint NOT NULL,
    "name" "text" NOT NULL
);

ALTER TABLE "public"."location" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."modbus_device" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "interface_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "slave_id" smallint NOT NULL
);

ALTER TABLE "public"."modbus_device" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."modbus_product" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "schema" "jsonb" NOT NULL,
    "name" "text",
    "version" "text",
    "manufacturer" "text",
    CONSTRAINT "modbus_product_schema_check" CHECK ("extensions"."jsonb_matches_schema"('{"title":"Product","description":"Product descriptor","type":"object","properties":{"metadata":{"description":"Metadata labels","type":"object","additionalProperties":{"type":"string"}},"registers":{"description":"Register definitions","type":"array","items":{"$ref":"#/$defs/register"},"uniqueItems":true}},"required":["registers"],"$defs":{"register":{"type":"object","properties":{"address":{"description":"Register address","type":"integer"},"name":{"description":"Register name","type":"string"},"description":{"description":"Register description","type":"string"},"factor":{"description":"Value scaling factor","type":"number","default":1},"offset":{"description":"Value offset","type":"number","default":0}},"required":["address","name"]}}}'::"json", "schema"))
);

ALTER TABLE "public"."modbus_product" OWNER TO "postgres";

ALTER TABLE "public"."modbus_product" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."modbus_device_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE "public"."modbus_device" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."modbus_device_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."modbus_interface" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "device_id" bigint NOT NULL,
    "config" "jsonb" NOT NULL,
    CONSTRAINT "modbus_interface_config_check" CHECK ("extensions"."jsonb_matches_schema"('{"title":"Interface","description":"Modbus interface configuration","type":"object","properties":{"tcp":{"oneOf":[{"$ref":"#/$defs/tcp"}]},"rtu":{"oneOf":[{"$ref":"#/$defs/rtu"}]}},"additionalProperties":false,"$defs":{"rtu":{"type":"object","description":"Serial interface connection","properties":{"baud_rate":{"description":"Baud rate","type":"integer"},"data_bits":{"description":"Data bits","type":"integer"},"stop_bits":{"$ref":"#/$defs/stop_bits"},"parity":{"$ref":"#/$defs/parity"}},"additionalProperties":false},"tcp":{"type":"object","description":"TCP interface connection","properties":{"address":{"type":"string","format":"ipv4"},"port":{"type":"integer","minimum":1,"maximum":65535}},"additionalProperties":false},"stop_bits":{"description":"Data bits","type":"number","enum":[1,1.5,2]},"parity":{"type":"string","enum":["even","odd","none"]}}}'::"json", "config"))
);

ALTER TABLE "public"."modbus_interface" OWNER TO "postgres";

ALTER TABLE "public"."modbus_interface" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."modbus_interface_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."notification" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "user_id" "uuid" NOT NULL,
    "org_id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "details" "text",
    "link" "text"
);

ALTER TABLE "public"."notification" OWNER TO "postgres";

ALTER TABLE "public"."alert" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notification_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE "public"."notification" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notification_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."org" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "instance_id" bigint,
    "key" "text" GENERATED ALWAYS AS ("extensions"."id_encode"("id", ''::"text", 4)) STORED,
    "billing_email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "abn" "text",
    CONSTRAINT "org_abn_check" CHECK ("public"."is_valid_abn"("abn")),
    CONSTRAINT "org_billing_email_check" CHECK (("length"("billing_email") <= 320)),
    CONSTRAINT "org_name_check" CHECK ((("length"("name") < 100) AND ("length"("name") >= 3))),
    CONSTRAINT "org_phone_check" CHECK (("length"("phone") < 20))
);

ALTER TABLE "public"."org" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."org_invite" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" bigint NOT NULL,
    "email" "text" NOT NULL,
    CONSTRAINT "org_invite_email_check" CHECK (("email" ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'::"text"))
);

ALTER TABLE "public"."org_invite" OWNER TO "postgres";

ALTER TABLE "public"."org_invite" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."org_invite_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."org_member" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "org_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role" DEFAULT 'viewer'::"public"."user_role" NOT NULL
);

ALTER TABLE "public"."org_member" OWNER TO "postgres";

ALTER TABLE "public"."org" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE "public"."org_member" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_membership_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."phone_mfa" (
    "user" "uuid" NOT NULL,
    "phone_number" "text" NOT NULL,
    "factor" "uuid" NOT NULL
);

ALTER TABLE "public"."phone_mfa" OWNER TO "postgres";

ALTER TABLE "public"."location" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."site_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY "public"."alert_receiver"
    ADD CONSTRAINT "alert_receiver_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."alert_rule"
    ADD CONSTRAINT "alert_rule_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."country"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."device"
    ADD CONSTRAINT "device_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hub"
    ADD CONSTRAINT "hub_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."hub"
    ADD CONSTRAINT "hub_machine_id_key" UNIQUE ("machine_id");

ALTER TABLE ONLY "public"."hub"
    ADD CONSTRAINT "hub_machine_secret_hash_key" UNIQUE ("machine_secret_hash");

ALTER TABLE ONLY "public"."hub"
    ADD CONSTRAINT "hub_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."hub"
    ADD CONSTRAINT "hub_root_password_key" UNIQUE ("root_password");

ALTER TABLE ONLY "public"."instance"
    ADD CONSTRAINT "instance_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."instance"
    ADD CONSTRAINT "instance_pkey" PRIMARY KEY ("id", "stub");

ALTER TABLE ONLY "public"."instance"
    ADD CONSTRAINT "instance_stub_key" UNIQUE ("stub");

ALTER TABLE ONLY "public"."modbus_product"
    ADD CONSTRAINT "modbus_device_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."modbus_product"
    ADD CONSTRAINT "modbus_device_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."modbus_device"
    ADD CONSTRAINT "modbus_device_pkey1" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."modbus_interface"
    ADD CONSTRAINT "modbus_interface_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."alert"
    ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_pkey1" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."org"
    ADD CONSTRAINT "org_id_key" UNIQUE ("id");

ALTER TABLE ONLY "public"."org_invite"
    ADD CONSTRAINT "org_invite_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."org"
    ADD CONSTRAINT "org_key_key" UNIQUE ("key");

ALTER TABLE ONLY "public"."org_member"
    ADD CONSTRAINT "org_member_unique_member" UNIQUE ("org_id", "user_id");

ALTER TABLE ONLY "public"."org_member"
    ADD CONSTRAINT "organization_membership_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."org"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."phone_mfa"
    ADD CONSTRAINT "phone_mfa_pkey" PRIMARY KEY ("user");

ALTER TABLE ONLY "public"."location"
    ADD CONSTRAINT "site_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."org_invite"
    ADD CONSTRAINT "unique_entries" UNIQUE ("org_id", "email");

CREATE UNIQUE INDEX "unique_alert" ON "public"."alert" USING "btree" ("org_id", (("metadata" ->> 'startsAt'::"text")), ((("metadata" -> 'labels'::"text") ->> 'alertname'::"text"))) WHERE ((("metadata" ->> 'startsAt'::"text") IS NOT NULL) AND ((("metadata" -> 'labels'::"text") ->> 'alertname'::"text") IS NOT NULL));

CREATE TRIGGER "add_owner_to_new_org" AFTER INSERT ON "public"."org" FOR EACH ROW EXECUTE FUNCTION "public"."add_owner_to_org_member"();

-- CREATE TRIGGER "hub_encrypt_secret_trigger_root_password" BEFORE INSERT OR UPDATE OF "root_password" ON "public"."hub" FOR EACH ROW EXECUTE FUNCTION "public"."hub_encrypt_secret_root_password"();

CREATE TRIGGER "invite-user" AFTER INSERT ON "public"."org_invite" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://mzynufuthvghqanlkluf.functions.supabase.co/invite', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eW51ZnV0aHZnaHFhbmxrbHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3OTk2OTA4NSwiZXhwIjoxOTk1NTQ1MDg1fQ.yaiEqvD860PAq5NKMVgLKeuYrIaWgCKhxEQ4syyq7m0"}', '{}', '1000');

CREATE TRIGGER "update-alert-config" AFTER INSERT OR DELETE OR UPDATE ON "public"."alert_rule" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://api.aerl.cloud/webhook/config/alerts', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eW51ZnV0aHZnaHFhbmxrbHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3OTk2OTA4NSwiZXhwIjoxOTk1NTQ1MDg1fQ.yaiEqvD860PAq5NKMVgLKeuYrIaWgCKhxEQ4syyq7m0"}', '{}', '1000');

ALTER TABLE ONLY "public"."alert"
    ADD CONSTRAINT "alert_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id");

ALTER TABLE ONLY "public"."alert_rule"
    ADD CONSTRAINT "alert_rule_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."device"
    ADD CONSTRAINT "device_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "public"."hub"("id");

ALTER TABLE ONLY "public"."device"
    ADD CONSTRAINT "device_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id");

ALTER TABLE ONLY "public"."device"
    ADD CONSTRAINT "device_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id");

ALTER TABLE ONLY "public"."location"
    ADD CONSTRAINT "location_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id");

ALTER TABLE ONLY "public"."modbus_device"
    ADD CONSTRAINT "modbus_device_interface_id_fkey" FOREIGN KEY ("interface_id") REFERENCES "public"."modbus_interface"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."modbus_device"
    ADD CONSTRAINT "modbus_device_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."modbus_product"("id");

ALTER TABLE ONLY "public"."modbus_interface"
    ADD CONSTRAINT "modbus_interface_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."org"
    ADD CONSTRAINT "org_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "public"."instance"("id");

ALTER TABLE ONLY "public"."org_invite"
    ADD CONSTRAINT "org_invite_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id");

ALTER TABLE ONLY "public"."org_member"
    ADD CONSTRAINT "org_member_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."org"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."org_member"
    ADD CONSTRAINT "org_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."org"
    ADD CONSTRAINT "org_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");

ALTER TABLE ONLY "public"."phone_mfa"
    ADD CONSTRAINT "phone_mfa_factor_fkey" FOREIGN KEY ("factor") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."phone_mfa"
    ADD CONSTRAINT "phone_mfa_user_fkey" FOREIGN KEY ("user") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE POLICY "Allow DELETE for users based on org_membership" ON "public"."org_member" FOR DELETE TO "authenticated" USING (("public"."check_org_membership"("org_id", "auth"."uid"()) AND ((((("auth"."jwt"() -> 'user_metadata'::"text") -> 'org'::"text") -> 'id'::"text"))::bigint = "org_id")));

CREATE POLICY "Allow DELETE for users in org" ON "public"."device" FOR DELETE TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'admin'::"public"."user_role")));

CREATE POLICY "Allow DELETE for users in org" ON "public"."org_invite" FOR DELETE TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'owner'::"public"."user_role")));

CREATE POLICY "Allow INSERT for authenticated users" ON "public"."org_invite" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'owner'::"public"."user_role")));

CREATE POLICY "Allow INSERT for users in org" ON "public"."device" FOR INSERT TO "authenticated" WITH CHECK (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'editor'::"public"."user_role")));

CREATE POLICY "Allow SELECT based on user's org membership" ON "public"."org" FOR SELECT TO "authenticated" USING ("public"."check_org_membership"("id", "auth"."uid"()));

CREATE POLICY "Allow SELECT for alerts in users' org" ON "public"."alert" FOR SELECT TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role")));

CREATE POLICY "Allow SELECT for all devices (bypass)" ON "public"."modbus_device" FOR SELECT TO "device" USING (true);

CREATE POLICY "Allow SELECT for all devices (bypass)" ON "public"."modbus_interface" FOR SELECT TO "device" USING (true);

CREATE POLICY "Allow SELECT for all products" ON "public"."modbus_product" FOR SELECT TO "device" USING (true);

CREATE POLICY "Allow SELECT for devices in users org" ON "public"."device" FOR SELECT TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role")));

CREATE POLICY "Allow SELECT for org and user" ON "public"."notification" FOR SELECT TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role") AND ("auth"."uid"() = "user_id")));

CREATE POLICY "Allow SELECT for rules in users' org" ON "public"."alert_rule" FOR SELECT TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role")));

CREATE POLICY "Allow SELECT for users based on user_id" ON "public"."org_member" FOR SELECT TO "authenticated" USING (("public"."check_org_membership"("org_id", "auth"."uid"()) AND ((((("auth"."jwt"() -> 'user_metadata'::"text") -> 'org'::"text") -> 'id'::"text"))::bigint = "org_id")));

CREATE POLICY "Allow SELECT for users in org" ON "public"."org_invite" FOR SELECT TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role")));

CREATE POLICY "Allow UPDATE for alerts in users' org" ON "public"."alert" FOR UPDATE TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'editor'::"public"."user_role"))) WITH CHECK (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'editor'::"public"."user_role")));

CREATE POLICY "Allow UPDATE for org and user" ON "public"."notification" FOR UPDATE TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role") AND ("auth"."uid"() = "user_id"))) WITH CHECK (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role") AND ("auth"."uid"() = "user_id")));

CREATE POLICY "Allow UPDATE for users in org" ON "public"."device" FOR UPDATE TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'editor'::"public"."user_role"))) WITH CHECK (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'editor'::"public"."user_role")));

CREATE POLICY "Enable INSERT for authenticated users only" ON "public"."org" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'email'::"text") <> 'example@aerl.cloud'::"text"));

CREATE POLICY "Enable SELECT access for all users" ON "public"."country" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable SELECT for users in org" ON "public"."location" FOR SELECT TO "authenticated" USING (("public"."check_user_current_org"("auth"."jwt"(), "org_id") AND "public"."check_user_access"("auth"."uid"(), "org_id", 'viewer'::"public"."user_role")));

CREATE POLICY "MFA TESTING - DELETE BEFORE PRODUCTION" ON "public"."phone_mfa" TO "authenticated" USING (true) WITH CHECK (true);

ALTER TABLE "public"."alert" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."alert_receiver" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."alert_rule" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."country" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."device" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."hub" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."instance" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."location" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."modbus_device" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."modbus_interface" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."modbus_product" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."notification" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."org" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."org_invite" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."org_member" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."phone_mfa" ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA "docs" TO "service_role";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "device";

GRANT ALL ON FUNCTION "public"."add_owner_to_org_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_owner_to_org_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_owner_to_org_member"() TO "service_role";

GRANT ALL ON FUNCTION "public"."assert_created_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."assert_created_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assert_created_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."check_org_membership"("org_id" bigint, "user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_org_membership"("org_id" bigint, "user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_org_membership"("org_id" bigint, "user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."check_user_access"("user_id" "uuid", "required_role" "public"."user_role") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_access"("user_id" "uuid", "required_role" "public"."user_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_access"("user_id" "uuid", "required_role" "public"."user_role") TO "service_role";

GRANT ALL ON FUNCTION "public"."check_user_access"("user_id" "uuid", "org_id" bigint, "required_role" "public"."user_role") TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_access"("user_id" "uuid", "org_id" bigint, "required_role" "public"."user_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_access"("user_id" "uuid", "org_id" bigint, "required_role" "public"."user_role") TO "service_role";

GRANT ALL ON FUNCTION "public"."check_user_current_org"("user_jwt" "jsonb", "org_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_current_org"("user_jwt" "jsonb", "org_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_current_org"("user_jwt" "jsonb", "org_id" bigint) TO "service_role";

GRANT ALL ON FUNCTION "public"."enhance_org_member_select"() TO "anon";
GRANT ALL ON FUNCTION "public"."enhance_org_member_select"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enhance_org_member_select"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_org_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_org_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_org_users"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_info"("subject_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_info"("subject_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_info"("subject_user_id" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."hub_encrypt_secret_root_password"() TO "anon";
GRANT ALL ON FUNCTION "public"."hub_encrypt_secret_root_password"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."hub_encrypt_secret_root_password"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_valid_abn"("abn_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_abn"("abn_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_abn"("abn_input" "text") TO "service_role";

GRANT ALL ON TABLE "public"."alert" TO "anon";
GRANT ALL ON TABLE "public"."alert" TO "authenticated";
GRANT ALL ON TABLE "public"."alert" TO "service_role";

GRANT ALL ON TABLE "public"."alert_receiver" TO "anon";
GRANT ALL ON TABLE "public"."alert_receiver" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_receiver" TO "service_role";

GRANT ALL ON SEQUENCE "public"."alert_receiver_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."alert_receiver_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."alert_receiver_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."alert_rule" TO "anon";
GRANT ALL ON TABLE "public"."alert_rule" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_rule" TO "service_role";

GRANT ALL ON SEQUENCE "public"."alert_rule_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."alert_rule_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."alert_rule_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."country" TO "anon";
GRANT ALL ON TABLE "public"."country" TO "authenticated";
GRANT ALL ON TABLE "public"."country" TO "service_role";

GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."hub" TO "anon";
GRANT ALL ON TABLE "public"."hub" TO "authenticated";
GRANT ALL ON TABLE "public"."hub" TO "service_role";

GRANT ALL ON TABLE "public"."decrypted_hub" TO "anon";
GRANT ALL ON TABLE "public"."decrypted_hub" TO "authenticated";
GRANT ALL ON TABLE "public"."decrypted_hub" TO "service_role";

GRANT ALL ON TABLE "public"."device" TO "anon";
GRANT ALL ON TABLE "public"."device" TO "authenticated";
GRANT ALL ON TABLE "public"."device" TO "service_role";

GRANT ALL ON SEQUENCE "public"."device_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."device_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."device_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."instance" TO "anon";
GRANT ALL ON TABLE "public"."instance" TO "authenticated";
GRANT ALL ON TABLE "public"."instance" TO "service_role";

GRANT ALL ON SEQUENCE "public"."instance_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."instance_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."instance_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."location" TO "anon";
GRANT ALL ON TABLE "public"."location" TO "authenticated";
GRANT ALL ON TABLE "public"."location" TO "service_role";

GRANT ALL ON TABLE "public"."modbus_device" TO "anon";
GRANT ALL ON TABLE "public"."modbus_device" TO "authenticated";
GRANT ALL ON TABLE "public"."modbus_device" TO "service_role";
GRANT SELECT ON TABLE "public"."modbus_device" TO "device";

GRANT ALL ON TABLE "public"."modbus_product" TO "anon";
GRANT ALL ON TABLE "public"."modbus_product" TO "authenticated";
GRANT ALL ON TABLE "public"."modbus_product" TO "service_role";
GRANT SELECT ON TABLE "public"."modbus_product" TO "device";

GRANT ALL ON SEQUENCE "public"."modbus_device_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."modbus_device_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."modbus_device_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."modbus_device_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."modbus_device_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."modbus_device_id_seq1" TO "service_role";

GRANT ALL ON TABLE "public"."modbus_interface" TO "anon";
GRANT ALL ON TABLE "public"."modbus_interface" TO "authenticated";
GRANT ALL ON TABLE "public"."modbus_interface" TO "service_role";
GRANT SELECT ON TABLE "public"."modbus_interface" TO "device";

GRANT ALL ON SEQUENCE "public"."modbus_interface_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."modbus_interface_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."modbus_interface_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."notification" TO "anon";
GRANT ALL ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";

GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."notification_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_id_seq1" TO "service_role";

GRANT ALL ON TABLE "public"."org" TO "anon";
GRANT ALL ON TABLE "public"."org" TO "authenticated";
GRANT ALL ON TABLE "public"."org" TO "service_role";

GRANT ALL ON TABLE "public"."org_invite" TO "anon";
GRANT ALL ON TABLE "public"."org_invite" TO "authenticated";
GRANT ALL ON TABLE "public"."org_invite" TO "service_role";

GRANT ALL ON SEQUENCE "public"."org_invite_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."org_invite_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."org_invite_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."org_member" TO "anon";
GRANT ALL ON TABLE "public"."org_member" TO "authenticated";
GRANT ALL ON TABLE "public"."org_member" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."organization_membership_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_membership_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_membership_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."phone_mfa" TO "anon";
GRANT ALL ON TABLE "public"."phone_mfa" TO "authenticated";
GRANT ALL ON TABLE "public"."phone_mfa" TO "service_role";

GRANT ALL ON SEQUENCE "public"."site_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."site_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."site_id_seq" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "docs" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "docs" GRANT ALL ON TABLES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
