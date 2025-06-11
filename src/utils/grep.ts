import { grep_search as _grep_search } from './tools';

export async function grep_search(query: string) {
  return _grep_search(query);
} 