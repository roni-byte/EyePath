CREATE SEQUENCE photos_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE client_results_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE studies_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE study_photos_seq START WITH 1 INCREMENT BY 50;
CREATE SEQUENCE result_points_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE IF NOT EXISTS studies (
    id INT PRIMARY KEY DEFAULT nextval('studies_seq'),
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS client_results (
    id INT PRIMARY KEY DEFAULT nextval('client_results_seq'),
    study_id INTEGER REFERENCES studies(id),
    name VARCHAR(100) NOT NULL,
    at_date TIMESTAMP(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
    id INT PRIMARY KEY DEFAULT nextval('photos_seq'),
    name VARCHAR(100) NOT NULL,
    hash VARCHAR(64) UNIQUE NOT NULL,
    photo_data BYTEA NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_photos (
    id INT PRIMARY KEY DEFAULT nextval('study_photos_seq'),
    study_id INTEGER NOT NULL REFERENCES studies(id),
    photo_id INTEGER NOT NULL REFERENCES photos(id),
    photo_order INTEGER NOT NULL,
    UNIQUE (study_id, photo_order)
);

CREATE TABLE IF NOT EXISTS result_points (
    id INT PRIMARY KEY DEFAULT nextval('result_points_seq'),
    result_id INTEGER NOT NULL REFERENCES client_results(id),
    photo_id INTEGER NOT NULL REFERENCES photos(id),
    timestamp_ms INTEGER,
    position_x FLOAT,
    position_y FLOAT,
    is_outside BOOLEAN
);
