-- Add separate columns for mg/dL and mmol/L values to avoid conversion rounding errors
-- This migration adds columns for storing glucose values in both units natively

-- Add new columns for storing values in both units
ALTER TABLE public.glucose_readings 
ADD COLUMN value_mg_dl DECIMAL(5,1) NULL,
ADD COLUMN value_mmol_l DECIMAL(4,1) NULL;

-- Add constraint to ensure at least one value is provided
ALTER TABLE public.glucose_readings 
ADD CONSTRAINT check_glucose_value_provided 
CHECK (value_mg_dl IS NOT NULL OR value_mmol_l IS NOT NULL);

-- Add constraints for reasonable value ranges
ALTER TABLE public.glucose_readings 
ADD CONSTRAINT check_mg_dl_range 
CHECK (value_mg_dl IS NULL OR (value_mg_dl > 0 AND value_mg_dl <= 500));

ALTER TABLE public.glucose_readings 
ADD CONSTRAINT check_mmol_l_range 
CHECK (value_mmol_l IS NULL OR (value_mmol_l > 0 AND value_mmol_l <= 27.8));

-- Create function to automatically populate both columns when inserting/updating
CREATE OR REPLACE FUNCTION public.sync_glucose_values()
RETURNS TRIGGER AS $$
BEGIN
    -- If mg/dL value is provided but mmol/L is not, calculate mmol/L
    IF NEW.value_mg_dl IS NOT NULL AND NEW.value_mmol_l IS NULL THEN
        NEW.value_mmol_l = ROUND((NEW.value_mg_dl / 18.0)::decimal, 1);
    END IF;
    
    -- If mmol/L value is provided but mg/dL is not, calculate mg/dL  
    IF NEW.value_mmol_l IS NOT NULL AND NEW.value_mg_dl IS NULL THEN
        NEW.value_mg_dl = ROUND((NEW.value_mmol_l * 18.0)::decimal, 1);
    END IF;
    
    -- Update the legacy value and unit columns for backwards compatibility
    IF NEW.unit = 'mg/dL' THEN
        NEW.value = NEW.value_mg_dl;
    ELSE
        NEW.value = NEW.value_mmol_l;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync glucose values
CREATE TRIGGER sync_glucose_values_trigger
    BEFORE INSERT OR UPDATE ON public.glucose_readings
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_glucose_values();

-- Migrate existing data to populate both columns
UPDATE public.glucose_readings 
SET 
    value_mg_dl = CASE 
        WHEN unit = 'mg/dL' THEN value 
        ELSE ROUND((value * 18.0)::decimal, 1)
    END,
    value_mmol_l = CASE 
        WHEN unit = 'mmol/L' THEN value 
        ELSE ROUND((value / 18.0)::decimal, 1)
    END;

-- Add comment to document the new approach
COMMENT ON COLUMN public.glucose_readings.value_mg_dl IS 'Glucose value in mg/dL - stored natively to avoid conversion rounding errors';
COMMENT ON COLUMN public.glucose_readings.value_mmol_l IS 'Glucose value in mmol/L - stored natively to avoid conversion rounding errors';