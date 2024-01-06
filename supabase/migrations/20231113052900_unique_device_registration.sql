CREATE UNIQUE INDEX device_hub_id_key ON public.device USING btree (hub_id);

alter table "public"."device" add constraint "device_hub_id_key" UNIQUE using index "device_hub_id_key";
