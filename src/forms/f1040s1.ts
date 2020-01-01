import * as mappings from '../mappings/f1040s1.json';
import { emptyForm, mergeForms } from '../utils';

export const f1040s1 = (input, output) => {
  const f1040s1 = mergeForms(mergeForms(emptyForm(mappings), input.f1040s1), output.f1040s1);
  return [f1040s1]
}
