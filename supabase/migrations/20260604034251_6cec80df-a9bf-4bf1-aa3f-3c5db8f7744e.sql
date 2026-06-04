-- CLASS STREAMS
CREATE TABLE public.class_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_streams TO anon, authenticated;
GRANT ALL ON public.class_streams TO service_role;
ALTER TABLE public.class_streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage class streams" ON public.class_streams FOR ALL USING (true) WITH CHECK (true);

-- SUBJECTS
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO anon, authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- STREAM SUBJECTS (assignment of subjects to streams)
CREATE TABLE public.stream_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL REFERENCES public.class_streams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stream_id, subject_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stream_subjects TO anon, authenticated;
GRANT ALL ON public.stream_subjects TO service_role;
ALTER TABLE public.stream_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage stream subjects" ON public.stream_subjects FOR ALL USING (true) WITH CHECK (true);

-- STUDENTS
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT,
  date_of_birth DATE,
  stream_id UUID REFERENCES public.class_streams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO anon, authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage students" ON public.students FOR ALL USING (true) WITH CHECK (true);

-- SCORES
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term TEXT NOT NULL DEFAULT 'Term 1',
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  ca_score NUMERIC NOT NULL DEFAULT 0,
  exam_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, subject_id, term, year)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scores TO anon, authenticated;
GRANT ALL ON public.scores TO service_role;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage scores" ON public.scores FOR ALL USING (true) WITH CHECK (true);

-- GRADE SCALES (configurable grading bands)
CREATE TABLE public.grade_scales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade TEXT NOT NULL,
  min_score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  remark TEXT,
  points NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_scales TO anon, authenticated;
GRANT ALL ON public.grade_scales TO service_role;
ALTER TABLE public.grade_scales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage grade scales" ON public.grade_scales FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_class_streams_updated BEFORE UPDATE ON public.class_streams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_scores_updated BEFORE UPDATE ON public.scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default grade scales (out of 100)
INSERT INTO public.grade_scales (grade, min_score, max_score, remark, points) VALUES
  ('A', 80, 100, 'Excellent', 4),
  ('B', 70, 79.99, 'Very Good', 3),
  ('C', 60, 69.99, 'Good', 2),
  ('D', 50, 59.99, 'Pass', 1),
  ('E', 0, 49.99, 'Fail', 0);