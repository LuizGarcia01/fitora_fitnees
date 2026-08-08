-- Bucket público para avatares dos usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Qualquer pessoa pode ver os avatares (público)
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Usuário autenticado pode fazer upload na própria pasta
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuário pode substituir o próprio avatar
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuário pode deletar o próprio avatar
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
