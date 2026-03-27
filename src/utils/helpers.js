export function getPersonName(staff, id) {
  if (!staff || !id) return "";

  const person = staff.find(p => p.id === id);
  return person ? person.name : "";
}
