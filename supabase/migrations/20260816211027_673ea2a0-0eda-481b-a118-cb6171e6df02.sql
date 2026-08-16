
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.order_status AS ENUM ('received','confirmed','preparing','ready','picked_up');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'قطعة',
  image_url text,
  in_stock boolean NOT NULL DEFAULT true,
  stock_quantity int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_order_number() RETURNS text
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v text;
BEGIN
  LOOP
    v := 'BM-' || to_char(now(),'YYMMDD') || '-' || lpad((floor(random()*10000))::int::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v);
  END LOOP;
  RETURN v;
END; $$;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  pickup_date date NOT NULL,
  pickup_time text NOT NULL,
  notes text,
  status public.order_status NOT NULL DEFAULT 'received',
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT public.generate_order_number();
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders public create" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit text NOT NULL DEFAULT 'قطعة',
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items public create" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "order items admin read" ON public.order_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.get_order_by_number(p_order_number text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'pickup_date', o.pickup_date,
    'pickup_time', o.pickup_time,
    'notes', o.notes,
    'status', o.status,
    'total', o.total,
    'created_at', o.created_at,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', i.product_name,
        'unit', i.unit,
        'unit_price', i.unit_price,
        'quantity', i.quantity
      ) ORDER BY i.created_at)
      FROM public.order_items i WHERE i.order_id = o.id
    ), '[]'::jsonb)
  ) INTO result
  FROM public.orders o
  WHERE upper(trim(o.order_number)) = upper(trim(p_order_number));
  RETURN result;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_order_by_number(text) TO anon, authenticated;

INSERT INTO public.categories (slug, name, image_url, sort_order) VALUES
 ('cement','الإسمنت','/images/cement.jpg',1),
 ('steel','الحديد','/images/steel.jpg',2),
 ('blocks','البلوك والطوب','/images/blocks.jpg',3),
 ('sand','الرمل والبحص','/images/sand.jpg',4),
 ('tiles','البلاط والسيراميك','/images/tiles.jpg',5),
 ('plumbing','مواد السباكة','/images/plumbing.jpg',6),
 ('electrical','مواد الكهرباء','/images/electrical.jpg',7),
 ('paints','الدهانات','/images/paints.jpg',8),
 ('tools','العدد والأدوات','/images/tools.jpg',9),
 ('insulation','مواد العزل','/images/insulation.jpg',10),
 ('finishing','مواد التشطيب','/images/finishing.jpg',11);

INSERT INTO public.products (category_id, name, description, price, unit, image_url, in_stock, stock_quantity, is_featured)
SELECT c.id, p.name, p.description, p.price, p.unit, c.image_url, true, p.qty, p.feat
FROM (VALUES
 ('cement','إسمنت بورتلاندي عادي 50 كجم','إسمنت عالي الجودة مناسب لجميع أعمال البناء والخرسانة',18.50,'كيس',400,true),
 ('cement','إسمنت مقاوم للأملاح 50 كجم','مقاوم للأملاح والكبريتات، مناسب للأساسات',21.00,'كيس',250,false),
 ('cement','إسمنت أبيض 50 كجم','إسمنت أبيض للتشطيبات والديكور',34.00,'كيس',120,false),
 ('steel','حديد تسليح 12 مم','حديد تسليح مطابق للمواصفات السعودية، طول 12 متر',3200.00,'طن',60,true),
 ('steel','حديد تسليح 16 مم','حديد تسليح عالي المقاومة للأعمدة والجسور',3250.00,'طن',45,false),
 ('steel','شبك حديد ملحوم','شبك حديد ملحوم للأرضيات والأسقف',95.00,'لوح',200,false),
 ('blocks','بلوك إسمنتي 20 سم','بلوك إسمنتي مفرغ عالي التحمل',3.75,'حبة',5000,true),
 ('blocks','بلوك إسمنتي 15 سم','بلوك إسمنتي للجدران الداخلية',3.10,'حبة',4200,false),
 ('blocks','طوب أحمر','طوب أحمر فخاري للديكور والبناء',1.20,'حبة',9000,false),
 ('sand','رمل أبيض مغسول','رمل نظيف مغسول لأعمال الخرسانة والبياض',350.00,'نقلة',30,false),
 ('sand','بحص مدرج','بحص متدرج الأحجام لأعمال الخرسانة',420.00,'نقلة',25,false),
 ('tiles','بلاط بورسلان 60×60','بلاط بورسلان مستورد بجودة عالية ومقاوم للخدش',48.00,'متر مربع',800,true),
 ('tiles','سيراميك جدران 30×60','سيراميك جدران للحمامات والمطابخ',29.00,'متر مربع',650,false),
 ('tiles','رخام أرضيات','رخام طبيعي فاخر للأرضيات',180.00,'متر مربع',150,false),
 ('plumbing','ماسورة UPVC 4 بوصة','ماسورة صرف صحي مقاومة للكسر',42.00,'ماسورة',300,false),
 ('plumbing','خلاط مغسلة','خلاط مياه معدني بضمان سنتين',110.00,'قطعة',90,true),
 ('plumbing','سخان مياه 50 لتر','سخان كهربائي موفر للطاقة',420.00,'قطعة',40,false),
 ('electrical','كيبل كهرباء 2.5 مم','كيبل نحاس نقي 100 متر',185.00,'لفة',120,false),
 ('electrical','مفتاح إنارة مزدوج','مفتاح إنارة بجودة عالية',18.00,'قطعة',500,false),
 ('electrical','لوحة توزيع كهرباء','لوحة توزيع 12 خط مع قواطع',260.00,'قطعة',35,false),
 ('paints','دهان بلاستيك داخلي 18 لتر','دهان مائي عديم الرائحة لجدران داخلية',165.00,'جالون',140,true),
 ('paints','دهان خارجي مقاوم للعوامل الجوية','دهان خارجي يتحمل الشمس والأمطار',235.00,'جالون',95,false),
 ('paints','معجون جدران 25 كجم','معجون تسوية للجدران قبل الدهان',48.00,'كيس',180,false),
 ('tools','مثقاب كهربائي 750 واط','مثقاب متعدد الاستخدامات مع حقيبة',245.00,'قطعة',50,false),
 ('tools','طقم مفاتيح 40 قطعة','طقم عدة يدوية متكامل',135.00,'طقم',70,false),
 ('tools','عربة بناء يدوية','عربة نقل مواد بعجلة مقوّاة',180.00,'قطعة',40,false),
 ('insulation','عزل مائي بيتوميني','رول عزل مائي للأسطح 10 متر',145.00,'رول',110,false),
 ('insulation','عزل حراري فوم','ألواح عزل حراري للأسطح والجدران',38.00,'لوح',300,false),
 ('finishing','جبس بورد 12 مم','ألواح جبس بورد للأسقف والقواطع',32.00,'لوح',400,true),
 ('finishing','كورنيش جبس ديكور','كورنيش جبس جاهز للتركيب',22.00,'متر طولي',600,false),
 ('finishing','لاصق سيراميك 25 كجم','لاصق قوي للسيراميك والبورسلان',26.00,'كيس',350,false)
) AS p(cat, name, description, price, unit, qty, feat)
JOIN public.categories c ON c.slug = p.cat;
