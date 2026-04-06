export const userProfile = {
  age: 39,
  gender: "Male",
  location: "South Africa",
  language: ["English", "IsiZulu"],
  maritalStatus: "Single",
  children: 3,
  household: 9,
  job: "Cyber Security Analyst & Developer",
  income: "$90k-$200k+"
};

export function injectProfile(task: string) {
  return `
User Profile:
${JSON.stringify(userProfile, null, 2)}

Task:
${task}
`;
}
