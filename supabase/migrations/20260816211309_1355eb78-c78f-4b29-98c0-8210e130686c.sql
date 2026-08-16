
REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.order_items FROM anon;
DROP POLICY "orders public create" ON public.orders;
DROP POLICY "order items public create" ON public.order_items;

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_pickup_date date,
  p_pickup_time text,
  p_notes text,
  p_items jsonb
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_product public.products%ROWTYPE;
  v_qty int;
BEGIN
  IF length(btrim(p_customer_name)) < 3 OR length(btrim(p_customer_name)) > 100 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF btrim(p_customer_phone) !~ '^[0-9+]{9,15}$' THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF p_pickup_date < current_date THEN
    RAISE EXCEPTION 'invalid_date';
  END IF;
  IF p_notes IS NOT NULL AND length(p_notes) > 500 THEN
    RAISE EXCEPTION 'invalid_notes';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0
     OR jsonb_array_length(p_items) > 60 THEN
    RAISE EXCEPTION 'invalid_items';
  END IF;

  INSERT INTO public.orders (customer_name, customer_phone, pickup_date, pickup_time, notes)
  VALUES (btrim(p_customer_name), btrim(p_customer_phone), p_pickup_date, btrim(p_pickup_time),
          NULLIF(btrim(COALESCE(p_notes,'')), ''))
  RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_product FROM public.products WHERE id = (v_item->>'product_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'product_not_found'; END IF;
    v_qty := GREATEST(1, LEAST(999, COALESCE((v_item->>'quantity')::int, 1)));

    INSERT INTO public.order_items (order_id, product_id, product_name, unit, unit_price, quantity)
    VALUES (v_order_id, v_product.id, v_product.name, v_product.unit, v_product.price, v_qty);

    v_total := v_total + (v_product.price * v_qty);
  END LOOP;

  UPDATE public.orders SET total = v_total WHERE id = v_order_id;
  RETURN v_order_number;
END; $$;
REVOKE EXECUTE ON FUNCTION public.create_order(text,text,date,text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text,text,date,text,text,jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_admin_if_none() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;
