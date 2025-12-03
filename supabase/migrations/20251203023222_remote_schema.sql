drop policy "tipo_plaza_select_public" on "public"."tipo_plaza";

drop policy "Los dueños pueden ver turnos de sus playas" on "public"."turno";

drop function if exists "public"."analytics_performance_playero"(p_fecha_desde timestamp with time zone, p_fecha_hasta timestamp with time zone, p_playa_id uuid, p_playero_id uuid, p_excluir_irregulares boolean);

-- Conditionally create storage triggers to avoid ownership and duplication issues
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_bucket_name_length_trigger'
	) THEN
		CREATE TRIGGER enforce_bucket_name_length_trigger
		BEFORE INSERT OR UPDATE OF name ON storage.buckets
		FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'objects_delete_delete_prefix'
	) THEN
		CREATE TRIGGER objects_delete_delete_prefix
		AFTER DELETE ON storage.objects
		FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'objects_insert_create_prefix'
	) THEN
		CREATE TRIGGER objects_insert_create_prefix
		BEFORE INSERT ON storage.objects
		FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'objects_update_create_prefix'
	) THEN
		CREATE TRIGGER objects_update_create_prefix
		BEFORE UPDATE ON storage.objects
		FOR EACH ROW WHEN (((NEW.name <> OLD.name) OR (NEW.bucket_id <> OLD.bucket_id)))
		EXECUTE FUNCTION storage.objects_update_prefix_trigger();
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'update_objects_updated_at'
	) THEN
		CREATE TRIGGER update_objects_updated_at
		BEFORE UPDATE ON storage.objects
		FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'prefixes_create_hierarchy'
	) THEN
		CREATE TRIGGER prefixes_create_hierarchy
		BEFORE INSERT ON storage.prefixes
		FOR EACH ROW WHEN ((pg_trigger_depth() < 1))
		EXECUTE FUNCTION storage.prefixes_insert_trigger();
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_trigger WHERE tgname = 'prefixes_delete_hierarchy'
	) THEN
		CREATE TRIGGER prefixes_delete_hierarchy
		AFTER DELETE ON storage.prefixes
		FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();
	END IF;
END $$;


