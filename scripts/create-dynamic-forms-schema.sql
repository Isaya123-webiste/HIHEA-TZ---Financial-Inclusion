-- Dynamic Forms Database Schema
-- This schema supports storing and managing dynamic form definitions

-- Form schemas table - stores form definitions
CREATE TABLE IF NOT EXISTS form_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    
    -- JSON schema definition
    schema_definition JSONB NOT NULL,
    
    -- Configuration
    settings JSONB DEFAULT '{}'::jsonb,
    submission_config JSONB DEFAULT '{}'::jsonb,
    theme JSONB DEFAULT '{}'::jsonb,
    analytics_config JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status and categorization
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Permissions (JSON array of user IDs or role names)
    permissions JSONB DEFAULT '{
        "view": [],
        "edit": [],
        "submit": [],
        "admin": []
    }'::jsonb,
    
    -- Internationalization
    default_language TEXT DEFAULT 'en',
    supported_languages TEXT[] DEFAULT ARRAY['en'],
    
    -- Integration settings
    integrations JSONB DEFAULT '{}'::jsonb,
    
    -- Custom metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Versioning
    parent_schema_id UUID REFERENCES form_schemas(id),
    is_template BOOLEAN DEFAULT FALSE,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Form instances table - stores individual form submissions/drafts
CREATE TABLE IF NOT EXISTS form_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schema_id UUID NOT NULL REFERENCES form_schemas(id) ON DELETE CASCADE,
    
    -- Form data
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- State management
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'submitted', 'approved', 'rejected')),
    current_step TEXT,
    completed_steps TEXT[] DEFAULT '{}',
    
    -- Validation and errors
    validation_errors JSONB DEFAULT '[]'::jsonb,
    is_valid BOOLEAN DEFAULT FALSE,
    
    -- User and session tracking
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Form field interactions table - for analytics
CREATE TABLE IF NOT EXISTS form_field_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
    field_id TEXT NOT NULL,
    
    -- Interaction details
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('focus', 'blur', 'change', 'error', 'validation')),
    field_value JSONB,
    previous_value JSONB,
    
    -- Timing
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    
    -- Context
    step_id TEXT,
    section_id TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Form submissions audit table
CREATE TABLE IF NOT EXISTS form_submission_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID NOT NULL REFERENCES form_instances(id) ON DELETE CASCADE,
    
    -- Audit details
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'submitted', 'approved', 'rejected', 'deleted')),
    performed_by UUID REFERENCES auth.users(id),
    
    -- Changes
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    
    -- Context
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Form templates table - for reusable form templates
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Template definition
    template_schema JSONB NOT NULL,
    
    -- Configuration
    is_public BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Tags and categorization
    tags TEXT[] DEFAULT '{}',
    industry TEXT,
    use_case TEXT,
    
    -- Versioning
    version TEXT DEFAULT '1.0.0',
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_schemas_created_by ON form_schemas(created_by);
CREATE INDEX IF NOT EXISTS idx_form_schemas_status ON form_schemas(status);
CREATE INDEX IF NOT EXISTS idx_form_schemas_category ON form_schemas(category);
CREATE INDEX IF NOT EXISTS idx_form_schemas_created_at ON form_schemas(created_at);
CREATE INDEX IF NOT EXISTS idx_form_schemas_tags ON form_schemas USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_form_schemas_schema_def ON form_schemas USING GIN(schema_definition);

CREATE INDEX IF NOT EXISTS idx_form_instances_schema_id ON form_instances(schema_id);
CREATE INDEX IF NOT EXISTS idx_form_instances_user_id ON form_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_form_instances_status ON form_instances(status);
CREATE INDEX IF NOT EXISTS idx_form_instances_created_at ON form_instances(created_at);
CREATE INDEX IF NOT EXISTS idx_form_instances_form_data ON form_instances USING GIN(form_data);

CREATE INDEX IF NOT EXISTS idx_form_field_interactions_instance_id ON form_field_interactions(instance_id);
CREATE INDEX IF NOT EXISTS idx_form_field_interactions_field_id ON form_field_interactions(field_id);
CREATE INDEX IF NOT EXISTS idx_form_field_interactions_timestamp ON form_field_interactions(timestamp);

CREATE INDEX IF NOT EXISTS idx_form_submission_audit_instance_id ON form_submission_audit(instance_id);
CREATE INDEX IF NOT EXISTS idx_form_submission_audit_performed_by ON form_submission_audit(performed_by);
CREATE INDEX IF NOT EXISTS idx_form_submission_audit_created_at ON form_submission_audit(created_at);

CREATE INDEX IF NOT EXISTS idx_form_templates_created_by ON form_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_is_public ON form_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_form_templates_tags ON form_templates USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE form_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submission_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_schemas
CREATE POLICY "Users can view published forms or own forms" ON form_schemas
    FOR SELECT USING (
        status = 'published' OR 
        created_by = auth.uid() OR
        auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(permissions->'view')))
    );

CREATE POLICY "Users can create forms" ON form_schemas
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own forms or have edit permission" ON form_schemas
    FOR UPDATE USING (
        created_by = auth.uid() OR
        auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(permissions->'edit')))
    );

CREATE POLICY "Users can delete own forms or have admin permission" ON form_schemas
    FOR DELETE USING (
        created_by = auth.uid() OR
        auth.uid() = ANY(ARRAY(SELECT jsonb_array_elements_text(permissions->'admin')))
    );

-- RLS Policies for form_instances
CREATE POLICY "Users can view own form instances" ON form_instances
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create form instances" ON form_instances
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own form instances" ON form_instances
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for form_field_interactions
CREATE POLICY "Users can view own field interactions" ON form_field_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM form_instances fi 
            WHERE fi.id = form_field_interactions.instance_id 
            AND fi.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create field interactions" ON form_field_interactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM form_instances fi 
            WHERE fi.id = form_field_interactions.instance_id 
            AND fi.user_id = auth.uid()
        )
    );

-- RLS Policies for form_templates
CREATE POLICY "Users can view public templates or own templates" ON form_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON form_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON form_templates
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own templates" ON form_templates
    FOR DELETE USING (created_by = auth.uid());

-- Functions for form management

-- Function to validate form schema
CREATE OR REPLACE FUNCTION validate_form_schema(schema_json JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic validation - check required fields
    IF NOT (schema_json ? 'id' AND schema_json ? 'title' AND schema_json ? 'fields') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate fields structure
    IF NOT jsonb_typeof(schema_json->'fields') = 'object' THEN
        RETURN FALSE;
    END IF;
    
    -- Additional validation logic can be added here
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get form statistics
CREATE OR REPLACE FUNCTION get_form_statistics(schema_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_instances', COUNT(*),
        'draft_instances', COUNT(*) FILTER (WHERE status = 'draft'),
        'submitted_instances', COUNT(*) FILTER (WHERE status = 'submitted'),
        'approved_instances', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected_instances', COUNT(*) FILTER (WHERE status = 'rejected'),
        'avg_completion_time', AVG(EXTRACT(EPOCH FROM (submitted_at - created_at))),
        'last_submission', MAX(submitted_at)
    ) INTO result
    FROM form_instances
    WHERE schema_id = schema_id_param AND deleted_at IS NULL;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to duplicate form schema
CREATE OR REPLACE FUNCTION duplicate_form_schema(
    source_schema_id UUID,
    new_title TEXT DEFAULT NULL,
    user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_schema_id UUID;
    source_schema RECORD;
BEGIN
    -- Get source schema
    SELECT * INTO source_schema
    FROM form_schemas
    WHERE id = source_schema_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Source schema not found';
    END IF;
    
    -- Create new schema
    INSERT INTO form_schemas (
        title,
        description,
        version,
        schema_definition,
        settings,
        submission_config,
        theme,
        analytics_config,
        created_by,
        status,
        category,
        tags,
        default_language,
        supported_languages,
        parent_schema_id,
        metadata
    ) VALUES (
        COALESCE(new_title, source_schema.title || ' (Copy)'),
        source_schema.description,
        '1.0.0',
        source_schema.schema_definition,
        source_schema.settings,
        source_schema.submission_config,
        source_schema.theme,
        source_schema.analytics_config,
        COALESCE(user_id, auth.uid()),
        'draft',
        source_schema.category,
        source_schema.tags,
        source_schema.default_language,
        source_schema.supported_languages,
        source_schema_id,
        source_schema.metadata
    ) RETURNING id INTO new_schema_id;
    
    RETURN new_schema_id;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old form instances
CREATE OR REPLACE FUNCTION archive_old_form_instances(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    UPDATE form_instances
    SET deleted_at = NOW()
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND status IN ('submitted', 'approved', 'rejected')
    AND deleted_at IS NULL;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_schemas_updated_at
    BEFORE UPDATE ON form_schemas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_instances_updated_at
    BEFORE UPDATE ON form_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_templates_updated_at
    BEFORE UPDATE ON form_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for form submission audit
CREATE OR REPLACE FUNCTION audit_form_instance_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO form_submission_audit (
            instance_id,
            action,
            performed_by,
            new_data,
            ip_address
        ) VALUES (
            NEW.id,
            'created',
            NEW.user_id,
            to_jsonb(NEW),
            NEW.ip_address
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO form_submission_audit (
            instance_id,
            action,
            performed_by,
            old_data,
            new_data,
            changes,
            ip_address
        ) VALUES (
            NEW.id,
            CASE 
                WHEN OLD.status != NEW.status AND NEW.status = 'submitted' THEN 'submitted'
                WHEN OLD.status != NEW.status AND NEW.status = 'approved' THEN 'approved'
                WHEN OLD.status != NEW.status AND NEW.status = 'rejected' THEN 'rejected'
                ELSE 'updated'
            END,
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW),
            jsonb_build_object(
                'form_data_changed', OLD.form_data != NEW.form_data,
                'status_changed', OLD.status != NEW.status
            ),
            NEW.ip_address
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO form_submission_audit (
            instance_id,
            action,
            performed_by,
            old_data
        ) VALUES (
            OLD.id,
            'deleted',
            auth.uid(),
            to_jsonb(OLD)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_form_instance_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON form_instances
    FOR EACH ROW
    EXECUTE FUNCTION audit_form_instance_changes();

-- Grant permissions
GRANT ALL ON form_schemas TO authenticated;
GRANT ALL ON form_instances TO authenticated;
GRANT ALL ON form_field_interactions TO authenticated;
GRANT ALL ON form_submission_audit TO authenticated;
GRANT ALL ON form_templates TO authenticated;

-- Create some sample form templates
INSERT INTO form_templates (name, description, category, template_schema, is_public, tags, industry, use_case, created_by) VALUES
(
    'Contact Form',
    'Simple contact form with name, email, and message fields',
    'contact',
    '{
        "id": "contact-form-template",
        "title": "Contact Form",
        "version": "1.0.0",
        "fields": {
            "name": {
                "id": "name",
                "name": "name",
                "type": "text",
                "label": "Full Name",
                "required": true,
                "validation": [{"type": "required", "message": "Name is required"}]
            },
            "email": {
                "id": "email",
                "name": "email",
                "type": "email",
                "label": "Email Address",
                "required": true,
                "validation": [
                    {"type": "required", "message": "Email is required"},
                    {"type": "email", "message": "Please enter a valid email"}
                ]
            },
            "message": {
                "id": "message",
                "name": "message",
                "type": "textarea",
                "label": "Message",
                "required": true,
                "properties": {"rows": 4},
                "validation": [{"type": "required", "message": "Message is required"}]
            }
        },
        "settings": {
            "allowSaveAsDraft": false,
            "requireAuthentication": false
        },
        "defaultLanguage": "en"
    }'::jsonb,
    true,
    ARRAY['contact', 'simple', 'basic'],
    'general',
    'customer_support',
    (SELECT id FROM auth.users LIMIT 1)
),
(
    'Survey Form',
    'Multi-step survey form with various question types',
    'survey',
    '{
        "id": "survey-form-template",
        "title": "Customer Satisfaction Survey",
        "version": "1.0.0",
        "fields": {
            "satisfaction": {
                "id": "satisfaction",
                "name": "satisfaction",
                "type": "rating",
                "label": "How satisfied are you with our service?",
                "required": true,
                "properties": {"maxRating": 5}
            },
            "recommend": {
                "id": "recommend",
                "name": "recommend",
                "type": "radio",
                "label": "Would you recommend us to others?",
                "required": true,
                "options": [
                    {"label": "Yes", "value": "yes"},
                    {"label": "No", "value": "no"},
                    {"label": "Maybe", "value": "maybe"}
                ]
            },
            "feedback": {
                "id": "feedback",
                "name": "feedback",
                "type": "textarea",
                "label": "Additional Feedback",
                "required": false,
                "properties": {"rows": 3}
            }
        },
        "settings": {
            "multiStep": true,
            "showProgress": true,
            "allowSaveAsDraft": true
        },
        "defaultLanguage": "en"
    }'::jsonb,
    true,
    ARRAY['survey', 'feedback', 'rating'],
    'general',
    'customer_feedback',
    (SELECT id FROM auth.users LIMIT 1)
);

COMMENT ON TABLE form_schemas IS 'Stores dynamic form schema definitions';
COMMENT ON TABLE form_instances IS 'Stores individual form submissions and drafts';
COMMENT ON TABLE form_field_interactions IS 'Tracks user interactions with form fields for analytics';
COMMENT ON TABLE form_submission_audit IS 'Audit trail for form submissions and changes';
COMMENT ON TABLE form_templates IS 'Reusable form templates';
