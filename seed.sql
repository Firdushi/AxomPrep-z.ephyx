insert into public.categories(name_en,name_as,description) values
('Physics','পদাৰ্থ বিজ্ঞান','Core physics concepts and practice.'),('Mathematics','গণিত','Mathematics practice for school and competitive exams.'),('General Science','সাধাৰণ বিজ্ঞান','General science learning resources.'),('Assam GK','অসম সাধাৰণ জ্ঞান','Assam-focused general knowledge.'),('Competitive Exams','প্ৰতিযোগিতামূলক পৰীক্ষা','General competitive examination preparation.') on conflict(name_en) do nothing;

insert into public.notes(title_en,title_as,excerpt_en,excerpt_as,content_en,content_as,category_id,slug,published)
select 'Introduction to Force','বলৰ পৰিচয়','A short demo note on force and its SI unit.','বল আৰু ইয়াৰ SI এককৰ সৰু পৰিচয়.','Force is a push or pull that can change the motion of an object. The SI unit of force is the newton (N). This is demo content and can be edited by an admin.','বল হৈছে কোনো বস্তুৰ গতি সলনি কৰিব পৰা ঠেলা বা টান. বলৰ SI একক নিউটন (N)। এইটো সম্পাদনাযোগ্য demo content.',id,'introduction-to-force',true from public.categories where name_en='Physics' on conflict(slug) do nothing;

insert into public.questions(question_en,question_as,options,correct_index,explanation_en,explanation_as,difficulty,category_id)
select 'What is the SI unit of force?','বলৰ SI একক কি?', '["Joule","Newton","Watt","Pascal"]'::jsonb,1,'The SI unit of force is the newton.','বলৰ SI একক নিউটন।','easy',id from public.categories where name_en='Physics' and not exists(select 1 from public.questions where question_en='What is the SI unit of force?');
insert into public.questions(question_en,question_as,options,correct_index,explanation_en,explanation_as,difficulty,category_id)
select 'What is 12 × 8?','12 × 8 কিমান?', '["86","96","108","112"]'::jsonb,1,'12 multiplied by 8 is 96.','12 ক 8 ৰে গুণ কৰিলে 96 হয়।','easy',id from public.categories where name_en='Mathematics' and not exists(select 1 from public.questions where question_en='What is 12 × 8?');

insert into public.tests(title_en,title_as,description_en,duration_minutes,published)
select 'Demo Foundation Test','ডেমো ফাউণ্ডেচন টেষ্ট','A small editable demo test for verifying the platform.',10,true where not exists(select 1 from public.tests where title_en='Demo Foundation Test');
insert into public.test_questions(test_id,question_id,position)
select t.id,q.id,case when q.question_en='What is the SI unit of force?' then 0 else 1 end from public.tests t cross join public.questions q where t.title_en='Demo Foundation Test' and q.question_en in ('What is the SI unit of force?','What is 12 × 8?') on conflict(test_id,question_id) do nothing;
