-- Add cancellation_fee column to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to explain the column
COMMENT ON COLUMN rides.cancellation_fee IS 'Fee charged to rider for cancelling the ride (in EUR)';
