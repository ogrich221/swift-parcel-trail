ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check CHECK (account_status IN ('pending', 'active', 'suspended', 'deactivated'));
ALTER TABLE public.profiles ALTER COLUMN account_status SET DEFAULT 'pending';

CREATE OR REPLACE FUNCTION public.create_customer_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'ogrichindeed@gmail.com' THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.profiles(
    id,
    first_name,
    last_name,
    phone,
    address,
    city,
    country,
    account_status
  ) VALUES(
    NEW.id,
    COALESCE(trim(NEW.raw_user_meta_data->>'first_name'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'last_name'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'phone'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'address'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'city'), ''),
    COALESCE(trim(NEW.raw_user_meta_data->>'country'), ''),
    'pending'
  ) ON CONFLICT(id) DO UPDATE SET
    first_name = CASE WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name ELSE public.profiles.first_name END,
    last_name = CASE WHEN EXCLUDED.last_name <> '' THEN EXCLUDED.last_name ELSE public.profiles.last_name END,
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    address = CASE WHEN EXCLUDED.address <> '' THEN EXCLUDED.address ELSE public.profiles.address END,
    city = CASE WHEN EXCLUDED.city <> '' THEN EXCLUDED.city ELSE public.profiles.city END,
    country = CASE WHEN EXCLUDED.country <> '' THEN EXCLUDED.country ELSE public.profiles.country END;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_customer_record() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid;
  sid uuid;
  category text;
  title text;
  message text;
BEGIN
  IF TG_TABLE_NAME = 'shipments' THEN
    uid = NEW.user_id;
    sid = NEW.id;
    category = 'shipment';
    IF TG_OP = 'INSERT' THEN
      title = 'Shipment created';
      message = 'Your shipment ' || NEW.tracking_id || ' has been registered.';
    ELSIF NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at AND NEW.cancelled_at IS NOT NULL THEN
      title = 'Shipment cancelled';
      message = 'Shipment ' || NEW.tracking_id || ' has been cancelled.';
    ELSIF NEW.estimated_delivery IS DISTINCT FROM OLD.estimated_delivery OR NEW.destination IS DISTINCT FROM OLD.destination THEN
      title = 'Shipment details updated';
      message = 'The details for ' || NEW.tracking_id || ' have been updated.';
    ELSE
      RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'shipment_events' THEN
    SELECT user_id, id INTO uid, sid FROM public.shipments WHERE id = NEW.shipment_id;
    category = 'shipment';
    title = NEW.status;
    message = NEW.location || CASE WHEN NEW.description <> '' THEN ' · ' || NEW.description ELSE '' END;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.account_status IS NOT DISTINCT FROM OLD.account_status THEN
      RETURN NEW;
    END IF;
    uid = NEW.id;
    category = 'account';
    IF OLD.account_status = 'pending' AND NEW.account_status = 'active' THEN
      title = 'Account approved';
      message = 'Your account has been approved by an administrator and is now active.';
    ELSE
      title = 'Account status updated';
      message = 'Your account is now ' || NEW.account_status || '.';
    END IF;
  END IF;
  IF uid IS NOT NULL THEN
    INSERT INTO public.customer_notifications(user_id, shipment_id, category, title, message, updated_by)
    VALUES(uid, sid, category, title, message, NEW.updated_by);
  END IF;
  RETURN NEW;
END $$;