
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  education_level TEXT,
  ssc_gpa NUMERIC,
  ssc_subjects TEXT,
  ssc_board TEXT,
  hsc_gpa NUMERIC,
  hsc_subjects TEXT,
  hsc_board TEXT,
  medium TEXT,
  countries TEXT[] DEFAULT '{}',
  program TEXT,
  intake TEXT,
  budget TEXT,
  scholarship_need TEXT,
  ielts NUMERIC,
  toefl INTEGER,
  sat INTEGER,
  act INTEGER,
  eca TEXT,
  hear_about TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Shortlist table
CREATE TABLE public.shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('university','scholarship')),
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE public.shortlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own shortlist" ON public.shortlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own shortlist" ON public.shortlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own shortlist" ON public.shortlist FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
