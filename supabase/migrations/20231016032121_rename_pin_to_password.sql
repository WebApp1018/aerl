drop view if exists "public"."decrypted_hub";

alter table "public"."hub" rename column "pin" to "password";

drop view "public"."decrypted_hub";

create or replace view "public"."decrypted_hub" as  SELECT hub.id,
    hub.created_at,
    hub.machine_id,
    hub.machine_secret_hash,
    hub.password,
    hub.root_password,
        CASE
            WHEN (hub.root_password IS NULL) THEN NULL::text
            ELSE
            CASE
                WHEN ('66e7550a-f337-411f-a49c-8c62de4573e5' IS NULL) THEN NULL::text
                ELSE convert_from(pgsodium.crypto_aead_det_decrypt(decode(hub.root_password, 'base64'::text), convert_to(''::text, 'utf8'::name), '66e7550a-f337-411f-a49c-8c62de4573e5'::uuid, NULL::bytea), 'utf8'::name)
            END
        END AS decrypted_root_password,
    hub.metadata
   FROM hub;
