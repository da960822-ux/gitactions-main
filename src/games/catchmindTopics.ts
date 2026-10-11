import dictionary from './catchmind-topic-dictionary.json';

export const catchmindCategories = dictionary.categories.map(({ id, label }) => ({ id, label }));
export type CatchmindCategoryId = typeof catchmindCategories[number]['id'];
export type TopicConcept = { id: string; category_id: CatchmindCategoryId; ko: string; es: string; aliases?: { ko?: string[]; es?: string[] } };
export const catchmindTopicWords = dictionary.words as TopicConcept[];
