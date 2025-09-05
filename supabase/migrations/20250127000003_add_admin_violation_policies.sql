-- Update violation_forms policies for team visibility
-- Boss needs to see all violations, but users can only edit their own

-- Drop the restrictive "Users can view their own forms" policy
DROP POLICY IF EXISTS "Users can view their own forms" ON public.violation_forms;

-- Replace with: All authenticated users can view all violation forms
CREATE POLICY "All users can view all violation forms" 
ON public.violation_forms 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Keep existing policies for editing (users can only edit their own)
-- "Users can create their own forms" - already exists
-- "Users can update their own forms" - already exists  
-- "Users can delete their own forms" - already exists

-- Add admin policies for full management access
CREATE POLICY "Admins can update any violation form" 
ON public.violation_forms 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete any violation form" 
ON public.violation_forms 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add a policy for admins to create forms on behalf of others (if needed)
CREATE POLICY "Admins can create forms for any user" 
ON public.violation_forms 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);