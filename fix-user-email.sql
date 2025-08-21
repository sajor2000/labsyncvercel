-- Query to check current user data
SELECT id, first_name, last_name, email, name FROM team_members WHERE id = '25473214';

-- Query to check all team members emails
SELECT id, name, email FROM team_members ORDER BY name;