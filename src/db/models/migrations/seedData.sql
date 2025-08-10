-- INSERT INTO public.users (username, email, password, full_name, phone, role)
-- VALUES
--   ('admin1', 'admin1@example.com', 'hashedpassword123', 'Admin One', '123-456-7890', 'Admin'),
--   ('staff1', 'staff1@example.com', 'hashedpassword123', 'Staff One', '123-456-7891', 'Staff'),
--   ('donor1', 'donor1@example.com', 'hashedpassword123', 'Donor One', '123-456-7892', 'Donor'),
--   ('recipient1', 'recipient1@example.com', 'hashedpassword123', 'Recipient One', '123-456-7893', 'Recipient'),
--   ('volunteer1', 'volunteer1@example.com', 'hashedpassword123', 'Volunteer One', '123-456-7894', 'Volunteer');

--   INSERT INTO public.foodbanks (name, address, city, state, zip, phone, email, opening_hours, closing_hours)
-- VALUES
--   ('Downtown Food Bank', '123 Main St', 'Metro City', 'StateX', '12345', '555-1000', 'contact@dfb.org', '08:00', '17:00'),
--   ('Westside Food Bank', '456 Elm St', 'Metro City', 'StateX', '12346', '555-1001', 'contact@wfb.org', '09:00', '18:00');


-- INSERT INTO public.inventory (foodbank_id, item_name, category, quantity, expiration_date, storage_location, dietary_category, barcode)
-- VALUES
--   (1, 'Canned Beans', 'Canned', 100, '2025-12-31', 'Shelf A1', 'Vegan', '123456789012'),
--   (1, 'Rice', 'Dry', 200, '2026-01-01', 'Shelf A2', 'Gluten-Free', '123456789013'),
--   (2, 'Apples', 'Fresh', 50, '2025-06-10', 'Fridge B1', 'Vegetarian', '123456789014');



-- INSERT INTO public.donations (donor_id, foodbank_id, status)
-- VALUES
--   (3, 1, 'Scheduled'),
--   (3, 2, 'Received');

-- INSERT INTO public.donation_items (donation_id, item_name, quantity, expiration_date, category)
-- VALUES
--   (1, 'Canned Corn', 50, '2025-12-01', 'Canned'),
--   (2, 'Oatmeal', 30, '2025-11-01', 'Dry');


-- INSERT INTO public.food_requests (recipient_id, foodbank_id, status, pickup_date, pickup_time)
-- VALUES
--   (4, 1, 'Pending', '2025-06-05', '10:00 AM');



-- INSERT INTO public.volunteer_shifts (foodbank_id, title, shift_date, start_time, end_time, coordinator_id)
-- VALUES
--   (1, 'Morning Shift', '2025-06-01', '08:00', '12:00', 2);

-- INSERT INTO public.volunteer_hours (volunteer_id, shift_id, hours_worked, work_date)
-- VALUES
--   (5, 1, 4.00, '2025-06-01');


-- INSERT INTO public.notifications (user_id, message, notification_type, reference_id)
-- VALUES
--   (4, 'Your food request is ready for pickup.', 'FoodRequest', '1');

-- INSERT INTO public.reports (title, generated_by, type)
-- VALUES
--   ('Monthly Donation Summary', 1, 'Donation');


-- INSERT INTO public.dietary_restrictions (name, description, icon)
-- VALUES
--   ('Vegan', 'No animal products', 'vegan.png'),
--   ('Gluten-Free', 'No gluten-containing ingredients', 'gluten_free.png');


-- INSERT INTO public.user_dietary_restrictions (user_id, restriction_id)
-- VALUES
--   (4, 1),
--   (4, 2);



-- INSERT INTO public.food_request_items (request_id, inventory_id, item_name, quantity_requested)
-- VALUES
--   (1, 4, 'Canned Beans', 1);