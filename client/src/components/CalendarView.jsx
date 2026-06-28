import { useState, useMemo } from 'react';

export default function CalendarView({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        // use local date formatting to avoid timezone shifts
        const d = new Date(task.dueDate);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [tasks]);

  const renderCells = () => {
    const cells = [];
    // empty slots before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }
    // days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = tasksByDate[dateKey] || [];
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      cells.push(
        <div key={day} className={`calendar-cell ${isToday ? 'today' : ''}`}>
          <div className="calendar-cell__header">
            <span className="calendar-cell__number">{day}</span>
          </div>
          <div className="calendar-cell__content">
            {dayTasks.map(task => (
              <div 
                key={task.id} 
                className={`calendar-task priority-${task.priority} ${task.status === 'completed' ? 'completed' : ''}`}
                title={task.title}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <div className="calendar-header__title">
          <h2>{monthNames[month]} {year}</h2>
        </div>
        <div className="calendar-header__actions">
          <button className="btn btn-sm btn-ghost" onClick={handleToday}>Today</button>
          <button className="btn btn-sm btn-ghost" onClick={handlePrevMonth}>&lt;</button>
          <button className="btn btn-sm btn-ghost" onClick={handleNextMonth}>&gt;</button>
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="calendar-day-name">Sun</div>
        <div className="calendar-day-name">Mon</div>
        <div className="calendar-day-name">Tue</div>
        <div className="calendar-day-name">Wed</div>
        <div className="calendar-day-name">Thu</div>
        <div className="calendar-day-name">Fri</div>
        <div className="calendar-day-name">Sat</div>
        {renderCells()}
      </div>
    </div>
  );
}
