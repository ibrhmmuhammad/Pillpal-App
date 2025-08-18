-- Create medication_taken table to track when medications are taken
CREATE TABLE public.medication_taken (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_schedule_id UUID NOT NULL REFERENCES public.medication_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_taken ENABLE ROW LEVEL SECURITY;

-- Create policies for medication_taken
CREATE POLICY "Users can view their own taken medications" 
ON public.medication_taken 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own taken medication records" 
ON public.medication_taken 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own taken medication records" 
ON public.medication_taken 
FOR DELETE 
USING (auth.uid() = user_id);