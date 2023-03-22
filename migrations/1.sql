-- drop table linkedin_users;
CREATE TABLE linkedin_users (
  id VARCHAR(255) PRIMARY KEY,
  access_token VARCHAR(2000) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  profile_url VARCHAR(255),
  token_expires_at DATETIME NOT NULL
);

