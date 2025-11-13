-- Limpiar datos del usuario de prueba para poder probar el flujo desde cero
DELETE FROM public.playero_playa WHERE playero_id = '9328eb1a-8b05-4e3a-9849-dfb9f4737aa0';
DELETE FROM public.rol_usuario WHERE usuario_id = '9328eb1a-8b05-4e3a-9849-dfb9f4737aa0';
DELETE FROM public.usuario WHERE usuario_id = '9328eb1a-8b05-4e3a-9849-dfb9f4737aa0';
DELETE FROM public.playero_invitacion WHERE email = 'reactiontimeshop@gmail.com';
