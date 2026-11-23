CREATE OR REPLACE FUNCTION public.create_customer_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles(
    id,
    first_name,
    last_name,
    phone,
    address,
    city,
    country
  ) VALUES(
    NEW.id,
    COALESCE(trim(NEW.raw_user_meta_data->>'first_name'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'last_name'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'phone'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'address'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'city'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'country'), '')
  ) ON CONFLICT(id) DO UPDATE SET
    first_name = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE public.profiles.first_name END,
    last_name = CASE WHEN EXCLUDED.last_name <> '' THEN EXCLUDED.last_name ELSE public.profiles.last_name END,
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    address = CASE WHEN EXCLUDED.address <> '' THEN EXCLUDED.address ELSE public.profiles.address END,
    city = CASE WHEN EXCLUDED.city <> '' THEN EXCLUDED.city ELSE public.profiles.city END,
    country = CASE WHEN EXCLUDED.country <> '' THEN EXCLUDED.country ELSE public.profiles.country END;
  RETURN NEW;
END $$;
