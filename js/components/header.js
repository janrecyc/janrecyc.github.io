export function renderHeader(user) {
  return `
    <header class="bg-white px-4 py-3 flex justify-between items-center shadow-sm">

      <div class="text-lg font-semibold">
        JanRecyc
      </div>

      <div class="text-sm text-gray-500">
        ${user.profile.full_name}
      </div>

    </header>
  `;
}
