-- Add support for threaded message replies
-- Adds parent_message_id to track reply relationships

-- Add parent_message_id column to class_messages
ALTER TABLE public.class_messages
ADD COLUMN parent_message_id UUID REFERENCES public.class_messages(id) ON DELETE CASCADE;

-- Add index for faster query of replies
CREATE INDEX idx_class_messages_parent ON public.class_messages(parent_message_id);

-- Add index for faster query of root messages (messages without a parent)
CREATE INDEX idx_class_messages_root ON public.class_messages(class_id, created_at DESC)
WHERE parent_message_id IS NULL;
