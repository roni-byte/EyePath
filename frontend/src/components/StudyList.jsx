export default function StudyList({ tests, onSelectTest }) {
  return (
    <div className="test-list">
      <h2>Test list</h2>
      {tests.length === 0 ? (
        <p>Zero tests available.</p>
      ) : (
        <ul>
          {tests.map((t) => (
            <li key={t.id} onClick={() => onSelectTest(t.id)}>
              {t.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
