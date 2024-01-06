set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_device(serial text, password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$begin
if exists (SELECT 1 FROM hub WHERE hub.id = add_device.serial AND hub.password = add_device.password) then insert into device (hub_id, org_id) values (add_device.serial, 2);
return true;
else
return false;
end if;
end;$function$
;

CREATE OR REPLACE FUNCTION public.add_device(serial text, password text, org_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  IF EXISTS (
            SELECT 1
            FROM org_member
            WHERE org_member.user_id = auth.uid()
            AND org_member.org_id = add_device.org_id
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM hub
      WHERE hub.id = add_device.serial
      AND hub.password = add_device.password
    ) THEN
      INSERT INTO device (hub_id, org_id) VALUES (add_device.serial, add_device.org_id);
      RETURN true;
    ELSE
      raise notice 'Device was not recognised.';
      PERFORM pg_sleep(1);
      RETURN false;
    END IF;
  ELSE
    raise notice 'User is not a member of the requested organisation';
    PERFORM pg_sleep(1);
    RETURN false;
  END IF;
END;$function$
;
