// components/member/MemberView.js
'use client';

import MemberTable from './MemberTable';
import MemberCard from './MemberCard';

export default function MemberView({
  members,
  loading,
  darkMode,
  selectedRows,
  handleSelectAll,
  handleSelectRow,
  handleEdit,
  handleDelete,
  view,
}) {
  return (
    <>
      {view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={handleEdit}
              onDelete={handleDelete}
              darkMode={darkMode}
            />
          ))}
        </div>
      ) : (
        <MemberTable
          members={members}
          loading={loading}
          darkMode={darkMode}
          selectedRows={selectedRows}
          handleSelectAll={handleSelectAll}
          handleSelectRow={handleSelectRow}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
}