import { renderResourceTypePage } from '@/features/resource-library/server/render-resource-type-page';

export const dynamic = 'force-dynamic';

export default function MaterialLibraryPage(): Promise<React.JSX.Element> {
  return renderResourceTypePage('material');
}
