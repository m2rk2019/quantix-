import { createClient } from '@/lib/supabase/server';

export async function generateBoqItemCode(
  projectId: string
): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('boq_items')
    .select('item_code')
    .eq('project_id', projectId)
    .order('item_code', { ascending: false })
    .limit(1);

  const lastCode = data?.[0]?.item_code;
  const match = lastCode?.match(/(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1;

  return `BOQ-${String(nextNumber).padStart(3, '0')}`;
}
