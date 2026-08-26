WITH source(slug,category,title,summary,published_at,view_count) AS (VALUES
 ('greenhouse-trends-2024','news','2024年温室行业发展趋势分析','随着农业现代化进程加快，智能温室、节能温室成为行业热点，我国温室面积持续增长。','2024-03-15'::timestamp,128),
 ('wenlo-greenhouse-guide','tech','文洛型玻璃温室设计建造要点详解','文洛型温室是目前国际上最成熟的温室结构形式之一，本文详解其设计要点和建造注意事项。','2024-02-20'::timestamp,256),
 ('winter-heating-tips','tech','北方温室冬季增温保温技术指南','北方地区冬季温室保温是关键，介绍日光温室、连栋温室冬季保温增温的实用技术。','2024-01-10'::timestamp,89),
 ('irrigation-water-saving','tech','温室水肥一体化灌溉系统节水技术','水肥一体化技术是现代温室农业的重要发展方向，可节水30%-50%，提高肥料利用率。','2023-12-05'::timestamp,67),
 ('company-cases-2023','news','2023年京阳温室重点项目回顾','回顾2023年公司承建的重点温室项目，涉及山东、陕西、河南等多个省份，总面积超3万平方米。','2023-12-28'::timestamp,45),
 ('pv-greenhouse-intro','tech','光伏温室：农业与新能源的完美结合','光伏温室通过在温室顶部铺设光伏板，实现农业种植与清洁能源发电双重效益。','2023-11-15'::timestamp,203)
), inserted AS (
 INSERT INTO articles(slug,category,is_published,published_at,view_count)
 SELECT slug,category,true,published_at,view_count FROM source
 ON CONFLICT(slug) DO UPDATE SET category=EXCLUDED.category
 RETURNING id,slug
)
INSERT INTO article_translations(article_id,lang,title,summary,content,is_locked)
SELECT a.id,'zh',s.title,s.summary,s.summary,false
FROM source s JOIN inserted a ON a.slug=s.slug
ON CONFLICT(article_id,lang) DO NOTHING;
