/**
 * MVJ INTERDEPARTMENT SPORTS
 * Application Configuration & Seed Data Definition
 * MVJ College of Engineering
 */

window.MVJ_CONFIG = {
  // Supabase Project Credentials
  // Set these once here for a stable connection throughout the project lifetime.
  // If the values are left blank, the app will use the saved browser values as a fallback.
  SUPABASE_URL: 'https://mspvtbrabwaclqhkirkk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcHZ0YnJhYndhY2xxaGtpcmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MjU2NjAsImV4cCI6MjEwOTAwMTY2MH0.ncAxDCykWo1nI_z-PYHqw1a58bg8dyDuYnItBG9dbeQ',

  // Official College Branding
  COLLEGE_NAME: 'MVJ COLLEGE OF ENGINEERING',
  PORTAL_TITLE: 'MVJ INTERDEPARTMENT SPORTS',
  TAGLINE: 'ONE COLLEGE. MULTIPLE DEPARTMENTS. ONE CHAMPION.',
  SUBTITLE: 'Celebrating sportsmanship, teamwork and interdepartmental excellence at MVJ College of Engineering.',
  LOGO_PATH: 'assets/images/mvj-logo.png',
  ACADEMIC_YEAR: '2026-2027',
  TOURNAMENT_STATUS: 'Ongoing', // 'Upcoming', 'Ongoing', 'Completed'

  // Standard Departments
  DEPARTMENTS: [
    { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE', points: 135, gold: 4, silver: 2, bronze: 1, color: '#174EA6' },
    { id: 'dept-aiml', name: 'Artificial Intelligence & Machine Learning', code: 'AIML', points: 110, gold: 3, silver: 2, bronze: 2, color: '#2878D0' },
    { id: 'dept-ise', name: 'Information Science & Engineering', code: 'ISE', points: 90, gold: 2, silver: 3, bronze: 1, color: '#0D9488' },
    { id: 'dept-ece', name: 'Electronics & Communication Engineering', code: 'ECE', points: 75, gold: 2, silver: 1, bronze: 2, color: '#7C3AED' },
    { id: 'dept-eee', name: 'Electrical & Electronics Engineering', code: 'EEE', points: 60, gold: 1, silver: 2, bronze: 1, color: '#EA580C' },
    { id: 'dept-me', name: 'Mechanical Engineering', code: 'ME', points: 45, gold: 1, silver: 1, bronze: 1, color: '#D97706' },
    { id: 'dept-civil', name: 'Civil Engineering', code: 'CIVIL', points: 35, gold: 0, silver: 1, bronze: 2, color: '#475569' },
    { id: 'dept-mba', name: 'Master of Business Administration', code: 'MBA', points: 25, gold: 0, silver: 1, bronze: 1, color: '#DB2777' }
  ],

  // Initial Sports
  SPORTS: [
    {
      id: 'sport-cricket',
      name: 'Cricket',
      slug: 'cricket',
      icon: 'fa-baseball-bat-ball',
      image: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=600&q=80',
      description: 'Interdepartment 15-over T-15 cricket championship with knockout fixtures.',
      current_stage: 'Semi-Finals'
    },
    {
      id: 'sport-football',
      name: 'Football',
      slug: 'football',
      icon: 'fa-futbol',
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80',
      description: 'High-intensity 7-a-side football tournament played on the main MVJ ground.',
      current_stage: 'Semi-Finals'
    },
    {
      id: 'sport-volleyball',
      name: 'Volleyball',
      slug: 'volleyball',
      icon: 'fa-volleyball',
      image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=600&q=80',
      description: 'Fast-paced standard interdepartment volleyball clash on the outdoor court.',
      current_stage: 'Completed'
    },
    {
      id: 'sport-basketball',
      name: 'Basketball',
      slug: 'basketball',
      icon: 'fa-basketball',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
      description: 'Full-court 5v5 basketball tournament held at the MVJ Sports Complex.',
      current_stage: 'Regular Matches'
    },
    {
      id: 'sport-kabaddi',
      name: 'Kabaddi',
      slug: 'kabaddi',
      icon: 'fa-people-group',
      image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
      description: 'Traditional high-energy Kabaddi tournament with pro-rules on the mud court.',
      current_stage: 'Completed'
    },
    {
      id: 'sport-badminton',
      name: 'Badminton',
      slug: 'badminton',
      icon: 'fa-feather',
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
      description: 'Singles and doubles indoor badminton tournament at the college auditorium.',
      current_stage: 'Semi-Finals'
    },
    {
      id: 'sport-table-tennis',
      name: 'Table Tennis',
      slug: 'table-tennis',
      icon: 'fa-table-tennis-paddle-ball',
      image: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?auto=format&fit=crop&w=600&q=80',
      description: 'Indoor speed and spin tournament in the college recreation center.',
      current_stage: 'Regular Matches'
    },
    {
      id: 'sport-chess',
      name: 'Chess',
      slug: 'chess',
      icon: 'fa-chess-knight',
      image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80',
      description: 'Classical 30-minute rapid interdepartment chess showdown.',
      current_stage: 'Completed'
    },
    {
      id: 'sport-throwball',
      name: 'Throwball',
      slug: 'throwball',
      icon: 'fa-volleyball',
      image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=600&q=80',
      description: 'Women interdepartment throwball championship with fierce rallies.',
      current_stage: 'Regular Matches'
    },
    {
      id: 'sport-athletics',
      name: 'Athletics',
      slug: 'athletics',
      icon: 'fa-person-running',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
      description: '100m, 200m, 4x100m relay, shot put and long jump track and field events.',
      current_stage: 'Ongoing'
    }
  ],

  // Initial Matches
  MATCHES: [
    // Cricket
    {
      id: 'match-cricket-1',
      sport_slug: 'cricket',
      stage: 'Regular',
      stage_label: 'Match 1',
      team_a: 'CSE',
      team_b: 'ME',
      score_a: '142/4 (15.0)',
      score_b: '118/8 (15.0)',
      match_date: '2026-10-25',
      match_time: '09:00 AM',
      venue: 'Main Cricket Ground',
      status: 'Completed',
      winner: 'CSE',
      result: 'CSE won by 24 runs'
    },
    {
      id: 'match-cricket-2',
      sport_slug: 'cricket',
      stage: 'Regular',
      stage_label: 'Match 2',
      team_a: 'AIML',
      team_b: 'CIVIL',
      score_a: '158/3 (15.0)',
      score_b: '122/9 (15.0)',
      match_date: '2026-10-25',
      match_time: '01:30 PM',
      venue: 'Main Cricket Ground',
      status: 'Completed',
      winner: 'AIML',
      result: 'AIML won by 36 runs'
    },
    {
      id: 'match-cricket-3',
      sport_slug: 'cricket',
      stage: 'Regular',
      stage_label: 'Match 3',
      team_a: 'ISE',
      team_b: 'EEE',
      score_a: '130/6 (15.0)',
      score_b: '131/4 (14.2)',
      match_date: '2026-10-26',
      match_time: '09:00 AM',
      venue: 'Main Cricket Ground',
      status: 'Completed',
      winner: 'EEE',
      result: 'EEE won by 6 wickets'
    },
    {
      id: 'match-cricket-sf1',
      sport_slug: 'cricket',
      stage: 'Semi-Final',
      stage_label: 'Semi-Final 1',
      team_a: 'CSE',
      team_b: 'EEE',
      score_a: '82/1 (8.4)',
      score_b: '125/7 (15.0)',
      match_date: '2026-10-31',
      match_time: '10:00 AM',
      venue: 'Main Cricket Ground',
      status: 'Live',
      winner: '',
      result: 'CSE needs 44 runs in 38 balls'
    },
    {
      id: 'match-cricket-sf2',
      sport_slug: 'cricket',
      stage: 'Semi-Final',
      stage_label: 'Semi-Final 2',
      team_a: 'AIML',
      team_b: 'ECE',
      score_a: '-',
      score_b: '-',
      match_date: '2026-11-01',
      match_time: '09:30 AM',
      venue: 'Main Cricket Ground',
      status: 'Upcoming',
      winner: '',
      result: 'Winner advances to Grand Final'
    },
    {
      id: 'match-cricket-gf',
      sport_slug: 'cricket',
      stage: 'Grand Final',
      stage_label: 'The Championship Final',
      team_a: 'Winner SF 1',
      team_b: 'Winner SF 2',
      score_a: '-',
      score_b: '-',
      match_date: '2026-11-03',
      match_time: '01:30 PM',
      venue: 'Main Cricket Ground',
      status: 'Upcoming',
      winner: '',
      result: 'Championship Gold Medal Match'
    },

    // Football
    {
      id: 'match-football-1',
      sport_slug: 'football',
      stage: 'Regular',
      stage_label: 'Quarter-Final 1',
      team_a: 'CSE',
      team_b: 'ECE',
      score_a: '3',
      score_b: '1',
      match_date: '2026-10-27',
      match_time: '02:00 PM',
      venue: 'Football Field A',
      status: 'Completed',
      winner: 'CSE',
      result: 'CSE won 3 - 1'
    },
    {
      id: 'match-football-2',
      sport_slug: 'football',
      stage: 'Regular',
      stage_label: 'Quarter-Final 2',
      team_a: 'AIML',
      team_b: 'ME',
      score_a: '2',
      score_b: '0',
      match_date: '2026-10-27',
      match_time: '03:45 PM',
      venue: 'Football Field A',
      status: 'Completed',
      winner: 'AIML',
      result: 'AIML won 2 - 0'
    },
    {
      id: 'match-football-sf1',
      sport_slug: 'football',
      stage: 'Semi-Final',
      stage_label: 'Semi-Final 1',
      team_a: 'CSE',
      team_b: 'ISE',
      score_a: '1',
      score_b: '0',
      match_date: '2026-10-31',
      match_time: '03:00 PM',
      venue: 'Football Field A',
      status: 'Live',
      winner: '',
      result: 'Second half in progress (52 min)'
    },
    {
      id: 'match-football-sf2',
      sport_slug: 'football',
      stage: 'Semi-Final',
      stage_label: 'Semi-Final 2',
      team_a: 'AIML',
      team_b: 'EEE',
      score_a: '-',
      score_b: '-',
      match_date: '2026-11-01',
      match_time: '02:30 PM',
      venue: 'Football Field A',
      status: 'Upcoming',
      winner: '',
      result: 'High-voltage clash for final berth'
    },
    {
      id: 'match-football-gf',
      sport_slug: 'football',
      stage: 'Grand Final',
      stage_label: 'The Championship Final',
      team_a: 'Winner SF 1',
      team_b: 'Winner SF 2',
      score_a: '-',
      score_b: '-',
      match_date: '2026-11-04',
      match_time: '03:30 PM',
      venue: 'Football Field A',
      status: 'Upcoming',
      winner: '',
      result: 'Title decider trophy match'
    },

    // Volleyball
    {
      id: 'match-volleyball-1',
      sport_slug: 'volleyball',
      stage: 'Regular',
      stage_label: 'Match 1',
      team_a: 'AIML',
      team_b: 'CIVIL',
      score_a: '2',
      score_b: '0',
      match_date: '2026-10-24',
      match_time: '10:00 AM',
      venue: 'Volleyball Court',
      status: 'Completed',
      winner: 'AIML',
      result: 'AIML won (25-18, 25-20)'
    },
    {
      id: 'match-volleyball-sf1',
      sport_slug: 'volleyball',
      stage: 'Semi-Final',
      stage_label: 'Semi-Final 1',
      team_a: 'CSE',
      team_b: 'ECE',
      score_a: '2',
      score_b: '1',
      match_date: '2026-10-29',
      match_time: '11:00 AM',
      venue: 'Volleyball Court',
      status: 'Completed',
      winner: 'CSE',
      result: 'CSE won thrilling decider set'
    },
    {
      id: 'match-volleyball-sf2',
      sport_slug: 'volleyball',
      stage: 'Semi-Final',
      stage_label: 'Semi-Final 2',
      team_a: 'AIML',
      team_b: 'ME',
      score_a: '2',
      score_b: '0',
      match_date: '2026-10-29',
      match_time: '02:00 PM',
      venue: 'Volleyball Court',
      status: 'Completed',
      winner: 'AIML',
      result: 'AIML won straight sets'
    },
    {
      id: 'match-volleyball-gf',
      sport_slug: 'volleyball',
      stage: 'Grand Final',
      stage_label: 'The Championship Final',
      team_a: 'CSE',
      team_b: 'AIML',
      score_a: '3',
      score_b: '1',
      match_date: '2026-10-30',
      match_time: '03:30 PM',
      venue: 'Volleyball Court',
      status: 'Completed',
      winner: 'CSE',
      result: 'CSE Champion (25-22, 23-25, 25-19, 25-21)'
    },

    // Basketball
    {
      id: 'match-basketball-1',
      sport_slug: 'basketball',
      stage: 'Regular',
      stage_label: 'Match 1',
      team_a: 'ISE',
      team_b: 'MBA',
      score_a: '54',
      score_b: '38',
      match_date: '2026-10-28',
      match_time: '11:00 AM',
      venue: 'Indoor Sports Complex',
      status: 'Completed',
      winner: 'ISE',
      result: 'ISE won by 16 points'
    },
    {
      id: 'match-basketball-sf1',
      sport_slug: 'basketball',
      stage: 'Semi-Final',
      stage_label: 'Semi-Final 1',
      team_a: 'CSE',
      team_b: 'ECE',
      score_a: '-',
      score_b: '-',
      match_date: '2026-11-01',
      match_time: '10:00 AM',
      venue: 'Indoor Sports Complex',
      status: 'Upcoming',
      winner: '',
      result: 'Top seed CSE takes on ECE'
    },
    {
      id: 'match-basketball-gf',
      sport_slug: 'basketball',
      stage: 'Grand Final',
      stage_label: 'The Championship Final',
      team_a: 'Winner SF 1',
      team_b: 'Winner SF 2',
      score_a: '-',
      score_b: '-',
      match_date: '2026-11-03',
      match_time: '04:00 PM',
      venue: 'Indoor Sports Complex',
      status: 'Upcoming',
      winner: '',
      result: 'Championship Trophy Final'
    }
  ],

  // Announcements
  ANNOUNCEMENTS: [
    {
      id: 'ann-1',
      title: 'Cricket Semi-Finals Live Streaming and Scoreboard',
      description: 'Cricket Semi-Final 1 between CSE and EEE is currently underway at the Main Cricket Ground. Check live scores right here on the portal.',
      category: 'Notice',
      publish_date: '2026-10-31',
      is_published: true
    },
    {
      id: 'ann-2',
      title: 'Athletics Heats Schedule Released',
      description: 'Track and field athletics heats for 100m, 200m, and 4x100m relay will commence tomorrow at 8:30 AM at the College Track.',
      category: 'Schedule Change',
      publish_date: '2026-10-31',
      is_published: true
    },
    {
      id: 'ann-3',
      title: 'Volleyball Finals Concluded: CSE Clinches Gold',
      description: 'Heartiest congratulations to the Computer Science & Engineering department for winning the Gold Medal in Volleyball after an intense 4-set grand final.',
      category: 'Result',
      publish_date: '2026-10-30',
      is_published: true
    },
    {
      id: 'ann-4',
      title: 'Tournament Fair Play & Discipline Guidelines',
      description: 'All participating student athletes and department supporters are requested to maintain sportsmanship and discipline on and off the court.',
      category: 'General',
      publish_date: '2026-10-28',
      is_published: true
    }
  ]
};
