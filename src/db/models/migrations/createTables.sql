-- Migration: create_initial_schema
-- Generated: 2025-05-30

-- -- ENUM types
-- CREATE TYPE user_role AS ENUM (
--   'Admin',
--   'Staff',
--   'Donor',
--   'Recipient',
--   'Volunteer'
-- );

-- CREATE TYPE dietary_category_enum AS ENUM (
--   'Vegan',
--   'Vegetarian',
--   'Gluten-Free',
--   'Kosher',
--   'Halal'
-- );

-- CREATE TYPE donation_status_enum AS ENUM (
--   'Scheduled',
--   'Received',
--   'Processed'
-- );

-- CREATE TYPE donation_item_category_enum AS ENUM (
--   'Canned',
--   'Dry',
--   'Fresh',
--   'Personal'
-- );

-- CREATE TYPE food_request_status_enum AS ENUM (
--   'Pending',
--   'Approved',
--   'Ready',
--   'Fulfilled'
-- );

-- CREATE TYPE volunteer_shift_status_enum AS ENUM (
--   'Open',
--   'Filled',
--   'Completed'
-- );

-- CREATE TYPE report_type_enum AS ENUM (
--   'Inventory',
--   'Donation',
--   'Distribution',
--   'Volunteer'
-- );

-- -- Tables

-- CREATE TABLE public.users (
--   user_id                SERIAL         PRIMARY KEY,
--   username               VARCHAR(50)    UNIQUE NOT NULL,
--   email                  VARCHAR(255)   UNIQUE NOT NULL,
--   password               VARCHAR(255)   NOT NULL,
--   full_name              VARCHAR(255)   NOT NULL,
--   phone                  VARCHAR(20),
--   role                   user_role      NOT NULL,
--   created_at             TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
--   last_login             TIMESTAMP,
--   dietary_restrictions   TEXT,
--   active                 BOOLEAN        DEFAULT TRUE,
--   verification_status    VARCHAR(50)    DEFAULT 'Pending'
-- );

-- CREATE TABLE public.foodbanks (
--   foodbank_id           SERIAL         PRIMARY KEY,
--   name                  VARCHAR(255)   NOT NULL,
--   address               VARCHAR(255)   NOT NULL,
--   city                  VARCHAR(100)   NOT NULL,
--   state                 VARCHAR(50)    NOT NULL,
--   zip                   VARCHAR(20)    NOT NULL,
--   phone                 VARCHAR(20)    NOT NULL,
--   email                 VARCHAR(255),
--   opening_hours         TIME           NOT NULL,
--   closing_hours         TIME           NOT NULL,
--   active                BOOLEAN        DEFAULT TRUE,
--   location_coordinates  VARCHAR(50)
-- );

-- CREATE TABLE public.inventory (
--   inventory_id          SERIAL               PRIMARY KEY,
--   foodbank_id           INT                  NOT NULL REFERENCES public.foodbanks(foodbank_id),
--   item_name             VARCHAR(255)         NOT NULL,
--   category              VARCHAR(100)         NOT NULL,
--   quantity              INT                  NOT NULL,
--   expiration_date       DATE,
--   storage_location      VARCHAR(100),
--   dietary_category      dietary_category_enum,
--   date_added            TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
--   barcode               VARCHAR(50),
--   low_stock             BOOLEAN              DEFAULT FALSE,
--   minimum_stock_level   INT                  DEFAULT 10
-- );

-- CREATE TABLE public.donations (
--   donation_id         SERIAL                   PRIMARY KEY,
--   donor_id            INT      NOT NULL        REFERENCES public.users(user_id),
--   foodbank_id         INT      NOT NULL        REFERENCES public.foodbanks(foodbank_id),
--   donation_date       TIMESTAMP               DEFAULT CURRENT_TIMESTAMP,
--   status              donation_status_enum NOT NULL,
--   receipt_generated   BOOLEAN                DEFAULT FALSE,
--   notes               TEXT,
--   scheduled_dropoff   TIMESTAMP
-- );

-- CREATE TABLE public.donation_items (
--   donation_item_id    SERIAL                         PRIMARY KEY,
--   donation_id         INT       NOT NULL             REFERENCES public.donations(donation_id),
--   inventory_id        INT                           REFERENCES public.inventory(inventory_id),
--   item_name           VARCHAR(255) NOT NULL,
--   quantity            INT           NOT NULL,
--   expiration_date     DATE,
--   category            donation_item_category_enum NOT NULL,
--   dietary_info        VARCHAR(255)
-- );

-- CREATE TABLE public.food_requests (
--   request_id           SERIAL                      PRIMARY KEY,
--   recipient_id         INT      NOT NULL           REFERENCES public.users(user_id),
--   foodbank_id          INT      NOT NULL           REFERENCES public.foodbanks(foodbank_id),
--   request_date         TIMESTAMP                 DEFAULT CURRENT_TIMESTAMP,
--   status               food_request_status_enum DEFAULT 'Pending',
--   pickup_date          DATE,
--   pickup_time          VARCHAR(50),
--   special_instructions TEXT,
--   recurring            BOOLEAN                   DEFAULT FALSE,
--   frequency            VARCHAR(50)
-- );

-- CREATE TABLE public.food_request_items (
--   request_item_id      SERIAL    PRIMARY KEY,
--   request_id           INT       NOT NULL            REFERENCES public.food_requests(request_id),
--   inventory_id         INT       NOT NULL            REFERENCES public.inventory(inventory_id),
--   item_name            VARCHAR(255) NOT NULL,
--   quantity_requested   INT       NOT NULL,
--   quantity_fulfilled   INT       DEFAULT 0
-- );

-- CREATE TABLE public.volunteer_shifts (
--   shift_id             SERIAL    PRIMARY KEY,
--   foodbank_id          INT       NOT NULL            REFERENCES public.foodbanks(foodbank_id),
--   title                VARCHAR(255) NOT NULL,
--   description          TEXT,
--   shift_date           DATE      NOT NULL,
--   start_time           TIME      NOT NULL,
--   end_time             TIME      NOT NULL,
--   capacity             INT       DEFAULT 1,
--   status               volunteer_shift_status_enum DEFAULT 'Open',
--   requirements         TEXT,
--   coordinator_id       INT       NOT NULL            REFERENCES public.users(user_id)
-- );

-- CREATE TABLE public.volunteer_hours (
--   hours_id             SERIAL    PRIMARY KEY,
--   volunteer_id         INT       NOT NULL            REFERENCES public.users(user_id),
--   shift_id             INT       NOT NULL            REFERENCES public.volunteer_shifts(shift_id),
--   hours_worked         DECIMAL(5,2) NOT NULL,
--   work_date            DATE      NOT NULL,
--   check_in             TIME,
--   check_out            TIME,
--   verified             BOOLEAN   DEFAULT FALSE,
--   activities           TEXT,
--   notes                TEXT
-- );

-- CREATE TABLE public.notifications (
--   notification_id      SERIAL       PRIMARY KEY,
--   user_id              INT          NOT NULL               REFERENCES public.users(user_id),
--   message              TEXT         NOT NULL,
--   created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
--   read                 BOOLEAN      DEFAULT FALSE,
--   notification_type    VARCHAR(50)  NOT NULL,
--   reference_id         VARCHAR(50)
-- );

-- CREATE TABLE public.reports (
--   report_id            SERIAL              PRIMARY KEY,
--   title                VARCHAR(255)        NOT NULL,
--   description          TEXT,
--   generated_at         TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
--   generated_by         INT                 NOT NULL           REFERENCES public.users(user_id),
--   type                 report_type_enum    NOT NULL,
--   parameters           TEXT,
--   file_path            VARCHAR(255)
-- );

-- CREATE TABLE public.dietary_restrictions (
--   restriction_id       SERIAL       PRIMARY KEY,
--   name                 VARCHAR(100) UNIQUE NOT NULL,
--   description          TEXT,
--   icon                 VARCHAR(255)
-- );

-- CREATE TABLE public.user_dietary_restrictions (
--   user_id              INT          NOT NULL               REFERENCES public.users(user_id),
--   restriction_id       INT          NOT NULL               REFERENCES public.dietary_restrictions(restriction_id),
--   PRIMARY KEY (user_id, restriction_id)
-- );
