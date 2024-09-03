import { MigrationInterface, QueryRunner } from 'typeorm'

export class Seeder8000000000000 implements MigrationInterface {
  name = 'Seeder8000000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // SUPERADMIN
    // N5v2LAzzfdgsfgssdzfs
    await queryRunner.query(
      `INSERT INTO public.users(
                        "email", "password", "full_name", "is_active", roles, "deleted_at", "created_at", "updated_at", "uid")
                        VALUES ('superadmin@superadmin.com', '$2b$10$UlLzuWw7XxW5tLdgPEsUc.qLS0zJfDBWVYfNKxUUEupWiUrXuGnQS', 'Super Admin', true, '{SUPER_ADMIN}', NULL, '2023-01-01', '2023-01-01', '46d197eb-f80d-4feb-a63d-4c8a57880302')`,
    )

    // Datos del hotel
    await queryRunner.query(
      `INSERT INTO public.hotel(
    "id", 
    "name", 
    "img_cover_path",
    "img_cover_thumb_path",
    "address", 
    "phone", 
    "description", 
    "whatsapp", 
    "instagram", 
    "facebook", 
    "gps_coords", 
    "email", 
    "uid"
)
VALUES (
    '00000000-0000-0000-0000-000000000000',  -- id fijo
    'Nombre Hotel',                          -- nombre del hotel
    'hotel/dummyImg_600-484.webp', -- imgCoverPath (puede ajustarse según sea necesario)
    'hotel/dummyImg_400-400.webp', -- imgCoverThumbPath (puede ajustarse según sea necesario)
    'Dirección del Hotel',                   -- dirección (puede ajustarse según sea necesario)
    '+1234567890',                           -- teléfono (ajustar según sea necesario)
    'Descripción del Hotel',                 -- descripción (ajustar según sea necesario)
    '+1234567890',                           -- whatsapp (opcional, puede ser NULL)
    'instagram_hotel',                       -- instagram (opcional, puede ser NULL)
    'facebook_hotel',                        -- facebook (opcional, puede ser NULL)
    '40.7128° N, 74.0060° W',                -- coordenadas GPS (ajustar según la ubicación real)
    'hotel@example.com',                     -- email del hotel
    (select id from users where email='superadmin@superadmin.com')                      -- uid (generado aleatoriamente)
)`,
    )

    // Datos del popup
    await queryRunner.query(
      `INSERT INTO public.popup(
	"id", 
	"uid",
	"name", 
	"title",
	"text",
	"enabled",
	"img_path",
    "img_thumb_path"
  )
  VALUES (
	  '00000000-0000-0000-0000-000000000001',  							-- id fijo
	  (select id from users where email='superadmin@superadmin.com'), 	-- uid (generado aleatoriamente)
	  'PopUp',  														-- nombre del popup
	  'Título del PopUp',                        						-- título del popup
	  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
	  'true', 															-- enabled (true/false)		
	  'popup/dummyImg_500-500.webp', 										-- imgPath (puede ajustarse según sea necesario)
	  'popup/dummyImg_400-400.webp'										-- imgThumbPath (puede ajustarse según sea necesario)
  )`,
    )

    // Banners
    await queryRunner.query(`INSERT INTO public.banner(
      uid,
      img_path,
      title,
      subtitle,
      description,
      button_enabled,
      button_text,
      button_link,
      date_in,
      date_out,
      enabled,
      "order",
      is_promo,
      thumb_path
      )
      VALUES
	 ((select id from users where email='superadmin@superadmin.com'),'banner/fe1560d1-7109-44bf-bf6e-90a41c3bad32_600-484.webp','Los aparts','Departamentos independientes','Los aparts de 2 ambientes cuentan con entrada propia, cocina completa, amplio living y parrilla individual.',true,'Conocé los aparts','/rooms/los-aparts',NULL,NULL,true,NULL,false,'banner/fe1560d1-7109-44bf-bf6e-90a41c3bad32_400-323.webp'),
	 ((select id from users where email='superadmin@superadmin.com'),'banner/2f850f9d-b529-4f1b-8a2e-183190056477_600-484.webp','Sobre la playa','Hermosas vistas','Nuestros Monoambientes se encuentran ubicados directamente sobre la playa. Con amplios ventanales y una hermosa vista al mar.asdfasdf',true,'Los monoambientes','/rooms/monoambientes',NULL,NULL,true,NULL,false,'banner/2f850f9d-b529-4f1b-8a2e-183190056477_400-323.webp'),
	 ((select id from users where email='superadmin@superadmin.com'),'banner/c9311e38-ca94-4c78-93a7-61cc2c30f197_600-484.webp','El complejo','Exteriores','Contamos con amplios espacios verdes para disfrutar de una estadía placentera y reconfortante en armonia con el entorno y garantizando el distanciamiento recomendado por protocolos sanitarios',true,'Fotos del complejo','/el-complejo',NULL,NULL,true,NULL,false,'banner/c9311e38-ca94-4c78-93a7-61cc2c30f197_400-323.webp');
      `)

    // Servicios del hotel
    await queryRunner.query(`INSERT INTO public.service (id,uid,"name",slug,description) VALUES
	 ('a9eedc04-3d55-4bcd-a8c0-e21722d54f56','3c3a6d9f-2978-416b-a144-d9f07de3b504','Bowling','bowling','3 canchas de bowling profesionales'),
	 ('136441af-4321-4010-bab2-30502aed3f28','3c3a6d9f-2978-416b-a144-d9f07de3b504','Cargador de auto eléctrico','cargador-auto-electrico','Cargador de auto eléctrico'),
	 ('e5a1c58d-cb24-452f-b57b-df947b428d64','3c3a6d9f-2978-416b-a144-d9f07de3b504','Mini golf','mini-golf','Mini golf'),
	 ('5a3fb5b6-5613-4532-94a1-db2e56a51b11','3c3a6d9f-2978-416b-a144-d9f07de3b504','Zona de trabajo','zona-trabajo',NULL),
	 ('2676e33d-6104-45e6-b0d6-6bc34c210014','3c3a6d9f-2978-416b-a144-d9f07de3b504','Bar','bar',NULL),
	 ('67d27269-c564-4cac-b2b3-880622f82d1b','3c3a6d9f-2978-416b-a144-d9f07de3b504','Restaurante','restaurante',NULL);`)

    // Servicios asociados al hotel
    await queryRunner.query(`INSERT INTO public.hotel_service (uid,hotel_id,service_id) VALUES
	 ('46d197eb-f80d-4feb-a63d-4c8a57880302','00000000-0000-0000-0000-000000000000','a9eedc04-3d55-4bcd-a8c0-e21722d54f56'),
	 ('46d197eb-f80d-4feb-a63d-4c8a57880302','00000000-0000-0000-0000-000000000000','136441af-4321-4010-bab2-30502aed3f28'),
	 ('46d197eb-f80d-4feb-a63d-4c8a57880302','00000000-0000-0000-0000-000000000000','e5a1c58d-cb24-452f-b57b-df947b428d64');`)

    // Equipamiento de las habitaciones
    await queryRunner.query(`INSERT INTO public.equipment (id,uid,"name",slug,description) VALUES
	 ('35c9c47b-3d7c-4245-8310-b9f07bb7ca61',(select id from users where email='superadmin@superadmin.com'),'Acceso a pistas de esquí','acceso-pistas-esqui',NULL),
	 ('ad0b1371-bcfd-43a4-bfe1-706c40ec472a',(select id from users where email='superadmin@superadmin.com'),'Acondicionador','acondicionador',NULL),
	 ('20e63234-2dd7-42f5-b715-aaac30df9a91',(select id from users where email='superadmin@superadmin.com'),'Agua caliente','agua-caliente',NULL),
	 ('9e6fb27a-0d42-4c1b-b727-372bfdbffa27',(select id from users where email='superadmin@superadmin.com'),'Aire acondicionado','aire-acondicionado',NULL),
	 ('7546183b-c8b3-4a93-98a3-5682f7927a43',(select id from users where email='superadmin@superadmin.com'),'Almohadas y mantas adicionales','almohadas-mantas-adicionales',NULL),
	 ('9a381e80-270e-47f3-bde4-6b5ae87f8c95',(select id from users where email='superadmin@superadmin.com'),'Arrocera','arrocera',NULL),
	 ('9f65c701-8fac-488f-8d4d-a1ac40e0009b',(select id from users where email='superadmin@superadmin.com'),'Ascensor','ascensor',NULL),
	 ('077eeae5-5568-402c-b177-6af6d508ffe4',(select id from users where email='superadmin@superadmin.com'),'Balcón','balcon',NULL),
	 ('f54b900a-7051-45c8-a350-3043387f7822',(select id from users where email='superadmin@superadmin.com'),'Bandeja de horno','bandeja-horno',NULL),
	 ('d5226b62-854a-4779-990d-384e82b5151f',(select id from users where email='superadmin@superadmin.com'),'Bañera para bebé','banera-bebe',NULL),
	 ('f4c653c0-59ad-4aec-ae11-f1ff9c605944',(select id from users where email='superadmin@superadmin.com'),'Bañera','banera',NULL),
	 ('ada437a4-c089-4162-b8da-8e1dff47f5ef',(select id from users where email='superadmin@superadmin.com'),'Barrera para bebé','barrera-bebe',NULL),
	 ('b65b62e5-036f-4f7f-a8f9-19c71b920c75',(select id from users where email='superadmin@superadmin.com'),'Barrera para chimenea','barrera-chimenea',NULL),
	 ('b90924f1-4a89-41bc-9120-1f4a1bb59caf',(select id from users where email='superadmin@superadmin.com'),'Bicicletas para niños','bicicletas-ninos',NULL),
	 ('e465c417-0202-4911-85ab-05ecac71019d',(select id from users where email='superadmin@superadmin.com'),'Bicicletas','bicicletas',NULL),
	 ('df3aaedf-c198-4817-b865-9ec2dc37604b',(select id from users where email='superadmin@superadmin.com'),'Billar','billar',NULL),
	 ('b729352d-f22b-4f7e-bdcf-d1aba8aef607',(select id from users where email='superadmin@superadmin.com'),'Cortinas black-out','black-out',NULL),
	 ('0265fe1b-d30b-402f-85df-bb5cca9b6cbf',(select id from users where email='superadmin@superadmin.com'),'Botiquín','botiquin',NULL),
	 ('a12ff71c-4652-4dd0-9fc3-8b88b5d0dc3a',(select id from users where email='superadmin@superadmin.com'),'Bowling','bowling',NULL),
	 ('a0fcc8ef-e22d-4d5e-a4b6-d0d30c0a94cd',(select id from users where email='superadmin@superadmin.com'),'Café','cafe',NULL),
	 ('af39cacb-97aa-4a29-aa09-f851b8fc2e1a',(select id from users where email='superadmin@superadmin.com'),'Cafetera','cafetera',NULL),
	 ('08c1b2a1-2e96-421b-bd22-d570ea4861ee',(select id from users where email='superadmin@superadmin.com'),'Caja fuerte','caja-fuerte',NULL),
	 ('393f41d5-634e-44c5-b08c-2be8f881a21d',(select id from users where email='superadmin@superadmin.com'),'Calefacción','calefaccion',NULL),
	 ('b3d2b9f2-dbe8-4c91-a685-a9b5dcc7d790',(select id from users where email='superadmin@superadmin.com'),'Cambiador de bebé','cambiador-bebe',NULL),
	 ('0d63f62e-ebd7-44c4-bf4f-d1ce8cdf0a95',(select id from users where email='superadmin@superadmin.com'),'Cargador de auto eléctrico','cargador-auto-electrico',NULL),
	 ('6845fa9c-6dd9-457d-be01-5e5988b2d008',(select id from users where email='superadmin@superadmin.com'),'Chimenea interior','chimenea-interior',NULL),
	 ('c312b49f-e0be-405b-a0f4-5d63c4113dec',(select id from users where email='superadmin@superadmin.com'),'Cine','cine',NULL),
	 ('79ee9ac2-477d-41f7-9f87-b0099e0a4478',(select id from users where email='superadmin@superadmin.com'),'Cocina al aire libre','cocina-exterior',NULL),
	 ('13eb397f-5fbc-4b55-a562-9face664b968',(select id from users where email='superadmin@superadmin.com'),'Cocina','cocina',NULL),
	 ('589238b0-e37f-455f-9f11-9f5e9b47772a',(select id from users where email='superadmin@superadmin.com'),'Compactador de basura','compactador-basura',NULL),
	 ('628729bd-9f09-4149-a9c4-f5b2c8133d56',(select id from users where email='superadmin@superadmin.com'),'Congelador','congelador',NULL),
	 ('a1ba8d86-527e-48b2-8138-999f9376d000',(select id from users where email='superadmin@superadmin.com'),'Consola de juegos','consola-juegos',NULL),
	 ('df007c35-1877-4398-9de9-ddfcbdf83bab',(select id from users where email='superadmin@superadmin.com'),'Copas de vino','copas-vino',NULL),
	 ('f299f73d-0027-4b46-9680-a7b47ada2666',(select id from users where email='superadmin@superadmin.com'),'Cuna','cuna',NULL),
	 ('f18b036f-54f3-438b-a193-3910f72762ba',(select id from users where email='superadmin@superadmin.com'),'Desayuno','desayuno',NULL),
	 ('2b7e7051-e9d8-48e3-be9a-31a138309aed',(select id from users where email='superadmin@superadmin.com'),'Detector de humo','detector-humo',NULL),
	 ('f8d09616-21b8-49ee-9b12-3092900e9e88',(select id from users where email='superadmin@superadmin.com'),'Ducha al aire libre','ducha-exterior',NULL),
	 ('102e1b40-8438-44fc-87cf-a13a5db47764',(select id from users where email='superadmin@superadmin.com'),'Elementos para la playa','elementos-playa',NULL),
	 ('dceadd7f-2547-4753-9660-524c7bcc8861',(select id from users where email='superadmin@superadmin.com'),'Entrada independiente','entrada-independiente',NULL),
	 ('5b953eef-ad90-4f79-b5e3-5fb8de9efa0e',(select id from users where email='superadmin@superadmin.com'),'Equipamiento de ejercicio','equipamiento-ejercicio',NULL),
	 ('f75548d4-0d6e-44a7-aca1-65612a7d68c6',(select id from users where email='superadmin@superadmin.com'),'Estacionamiento gratuito en la calle','estacionamiento-gratis-calle',NULL),
	 ('6b7834fc-b8a8-44db-8be5-bd9299f3ad9d',(select id from users where email='superadmin@superadmin.com'),'Estacionamiento gratuito en la propiedad','estacionamiento-gratis-propiedad',NULL),
	 ('e626a49d-ecd6-4dc7-8697-487232958af2',(select id from users where email='superadmin@superadmin.com'),'Estacionamiento de pago en la calle','estacionamiento-pago-calle',NULL),
	 ('d08b1254-1fdb-48f3-9e6c-249497666584',(select id from users where email='superadmin@superadmin.com'),'Estacionamiento de pago en la propiedad','estacionamiento-pago-propiedad',NULL),
	 ('9961b611-7e66-4439-82de-78e0eb4e28e3',(select id from users where email='superadmin@superadmin.com'),'Estadías largas','estadias-largas',NULL),
	 ('d9280a7c-c842-4d1b-86d2-9407d26f160e',(select id from users where email='superadmin@superadmin.com'),'Ethernet','ethernet',NULL),
	 ('f0489fd9-4b21-478d-9cc9-86f5dc6551fb',(select id from users where email='superadmin@superadmin.com'),'Extintor','extintor',NULL),
	 ('7522a3fd-8fe2-4eda-a712-95c80ee8d314',(select id from users where email='superadmin@superadmin.com'),'Fogata','fogata',NULL),
	 ('93f3c318-ac4d-4ba5-b495-2a32aea5400e',(select id from users where email='superadmin@superadmin.com'),'Frente a la playa','frente-playa',NULL),
	 ('04d33ae9-6d21-4357-bbdb-2849a8904016',(select id from users where email='superadmin@superadmin.com'),'Frigobar','frigobar',NULL),
	 ('78f89da5-169c-4871-977f-a4d28356a873',(select id from users where email='superadmin@superadmin.com'),'Gel de ducha','gel-ducha',NULL),
	 ('db89c52c-a4dd-4693-bfb8-59997d273230',(select id from users where email='superadmin@superadmin.com'),'Gimnasio','gimnasio',NULL),
	 ('71aabc11-b355-4c6e-8997-d93d707f32f6',(select id from users where email='superadmin@superadmin.com'),'Hamaca','hamaca',NULL),
	 ('1b81c16a-b7ca-45e1-adef-4e9ada1a47f1',(select id from users where email='superadmin@superadmin.com'),'Heladera','heladera',NULL),
	 ('2bc32e3d-6de8-4d1e-8e57-6312f705c2dc',(select id from users where email='superadmin@superadmin.com'),'Hockey','hockey',NULL),
	 ('34adf3f1-367e-4c13-83ab-d9cbf79a1995',(select id from users where email='superadmin@superadmin.com'),'Horno','horno',NULL),
	 ('097c59e7-9ae7-427e-b949-28da345df46e',(select id from users where email='superadmin@superadmin.com'),'Jabón para el cuerpo','jabon-cuerpo',NULL),
	 ('3ac2c1a5-ca9c-4557-82ac-71a67022c6e8',(select id from users where email='superadmin@superadmin.com'),'Jacuzzi','jacuzzi',NULL),
	 ('4d247f89-05ae-479f-9600-27eb203f5b30',(select id from users where email='superadmin@superadmin.com'),'Jaula de béisbol','jaula-baseball',NULL),
	 ('2695e885-541b-4147-b94d-7bd77b0bbda2',(select id from users where email='superadmin@superadmin.com'),'Juegos de mesa tamaño real','juegos-mesa-tamano-real',NULL),
	 ('bf1a10ad-2615-4407-bc33-61df1a4e5124',(select id from users where email='superadmin@superadmin.com'),'Juegos de mesa','juegos-mesa',NULL),
	 ('dcf86846-eea0-4c93-ac38-66c7d2d72019',(select id from users where email='superadmin@superadmin.com'),'Juegos para niños al aire libre','juegos-ninos-aire-libre',NULL),
	 ('0b18b7a2-a8f4-43c9-bbd9-b325469d202a',(select id from users where email='superadmin@superadmin.com'),'Kayak','kayak',NULL),
	 ('b4efb192-72f1-4e5a-a40f-9bc4cec6f8df',(select id from users where email='superadmin@superadmin.com'),'Kitchenette','kitchenette',NULL),
	 ('772a385f-2cc7-405f-bf75-31e82fee4ff2',(select id from users where email='superadmin@superadmin.com'),'Laser tag','laser-tag',NULL),
	 ('79022676-bb1c-449e-9820-b6f1969fd36b',(select id from users where email='superadmin@superadmin.com'),'Lavandería cercana','lavanderia-cercana',NULL),
	 ('6e49c1af-c5a4-478e-ae13-ed450a87116c',(select id from users where email='superadmin@superadmin.com'),'Lavarropas','lavarropas',NULL),
	 ('43c993b7-9110-4472-a7b6-383d74d6582c',(select id from users where email='superadmin@superadmin.com'),'Lavavajillas','lavavajillas',NULL),
	 ('ffc1fd9a-88dd-4eb7-bd18-fda2e7114ab1',(select id from users where email='superadmin@superadmin.com'),'Libros y juguetes para niños','libros-juguetes-ninos',NULL),
	 ('2cee2563-e8d9-46af-bfa7-5e1b078420b5',(select id from users where email='superadmin@superadmin.com'),'Libros','libros',NULL),
	 ('d7dc78a1-3e25-4648-9f62-8307ef87f345',(select id from users where email='superadmin@superadmin.com'),'Licuadora','licuadora',NULL),
	 ('c6a07fe8-ed80-4fa4-9925-a78b45315719',(select id from users where email='superadmin@superadmin.com'),'Limpieza','limpieza',NULL),
	 ('008c194a-3800-4e0a-bd00-f380751adc57',(select id from users where email='superadmin@superadmin.com'),'Living privado','living-privado',NULL),
	 ('e25fd145-5d96-43f3-9c59-039a0a5e7d4d',(select id from users where email='superadmin@superadmin.com'),'Máquina de pan','maquina-pan',NULL),
	 ('a0c54013-e595-4714-a22b-e10343bee36b',(select id from users where email='superadmin@superadmin.com'),'Mesa de comedor','mesa-comedor',NULL),
	 ('5f3a36a5-4fb7-4b35-9685-7cd8a6d6f006',(select id from users where email='superadmin@superadmin.com'),'Microondas','microondas',NULL),
	 ('adaf9251-9837-4221-9ab0-0e4f94f37332',(select id from users where email='superadmin@superadmin.com'),'Mini golf','mini-golf',NULL),
	 ('aec75afa-92fc-48d3-92b3-e7b19bf80907',(select id from users where email='superadmin@superadmin.com'),'Monitor de bebé','monitor-bebe',NULL),
	 ('26466e2d-1144-473f-83d6-0eac6afbb899',(select id from users where email='superadmin@superadmin.com'),'Mosquitero','mosquitero',NULL),
	 ('f03d6903-274e-4b6a-87c2-ca2f19abc3c8',(select id from users where email='superadmin@superadmin.com'),'Muebles de exterior','muebles-exterior',NULL),
	 ('d706ed8e-ade3-4e63-a0a1-acb818150d29',(select id from users where email='superadmin@superadmin.com'),'Muelle para barcos','muelle-barcos',NULL),
	 ('0d5487d3-dc91-4dae-8fc3-ca546bd182b0',(select id from users where email='superadmin@superadmin.com'),'Muro de escalada','muro-escalada',NULL),
	 ('307c7a7b-728a-4408-8183-c5d715c99add',(select id from users where email='superadmin@superadmin.com'),'Parrilla','parrilla',NULL),
	 ('189ce5ef-45b5-4190-a6cb-3cce4922444d',(select id from users where email='superadmin@superadmin.com'),'Patio','patio',NULL),
	 ('546c87dd-e386-4448-a140-ae0873cb5a8c',(select id from users where email='superadmin@superadmin.com'),'Pava eléctrica','pava-electrica',NULL),
	 ('de85dc74-8375-460c-b576-6ef081764d96',(select id from users where email='superadmin@superadmin.com'),'Perchas','perchas',NULL),
	 ('7b68a37a-ee98-47c5-91e6-bdc7e539ef71',(select id from users where email='superadmin@superadmin.com'),'Piano','piano',NULL),
	 ('638867a6-fd03-4395-82b5-55cbacfbfcc6',(select id from users where email='superadmin@superadmin.com'),'Pileta','pileta',NULL),
	 ('d43fc72b-1087-4ddd-aa68-7829f5be6d2a',(select id from users where email='superadmin@superadmin.com'),'Ping pong','ping-pong',NULL),
	 ('20557051-95bc-45f2-81f1-a918547b6cdc',(select id from users where email='superadmin@superadmin.com'),'Placard','placard',NULL),
	 ('01a91697-19b5-4c2e-9423-50da9191d4ea',(select id from users where email='superadmin@superadmin.com'),'Plancha','plancha',NULL),
	 ('f797d28d-09da-4121-99fe-dac92fbf77fd',(select id from users where email='superadmin@superadmin.com'),'Platos y cubiertos para niños','platos-cubiertos-ninos',NULL),
	 ('5c5a0e0c-cdd0-43f7-a974-d4c6b1deab2b',(select id from users where email='superadmin@superadmin.com'),'Practicuna','practicuna',NULL),
	 ('089e7810-bad2-46ee-8ae8-7cf77c67d1cd',(select id from users where email='superadmin@superadmin.com'),'Productos de limpieza','productos-limpieza',NULL),
	 ('ac89319c-9dce-4a31-a0f7-89b2eec15f09',(select id from users where email='superadmin@superadmin.com'),'Protector de enchufe','protector-enchufe',NULL),
	 ('7484f585-6730-4e4b-be35-724d7a6ba8a5',(select id from users where email='superadmin@superadmin.com'),'Protector de esquina de mesa','protector-esquina-mesa',NULL),
	 ('ee319997-4b92-4be5-a6ac-79ae5e6c5288',(select id from users where email='superadmin@superadmin.com'),'Rampa de skate','rampa-skate',NULL),
	 ('b86da19c-7d74-427a-9a57-94773de4075b',(select id from users where email='superadmin@superadmin.com'),'Reposera','reposera',NULL),
	 ('51d4ae02-0c7b-4494-9e88-b38c7c9c9399',(select id from users where email='superadmin@superadmin.com'),'Ropa de cama','ropa-cama',NULL),
	 ('06dea2e2-42db-4b22-882c-7fe16ee1e166',(select id from users where email='superadmin@superadmin.com'),'Sala de juegos para niños','sala-juegos-ninos',NULL),
	 ('5145d163-6c76-4432-9a4d-86e105cf5a22',(select id from users where email='superadmin@superadmin.com'),'Sala de juegos','sala-juegos',NULL),
	 ('5c742b1a-a157-46f5-afde-a8670f80c640',(select id from users where email='superadmin@superadmin.com'),'Sala temática','sala-tematica',NULL),
	 ('7f42ef94-67c7-4d33-8118-1e7415bf8d11',(select id from users where email='superadmin@superadmin.com'),'Sauna','sauna',NULL),
	 ('ac828048-3cb7-4f2f-831a-929ec8cd2929',(select id from users where email='superadmin@superadmin.com'),'Secador de pelo','secador-pelo',NULL),
	 ('31322bec-2113-4cda-88eb-5d1fd2027dba',(select id from users where email='superadmin@superadmin.com'),'Secadora','secadora',NULL),
	 ('9f6caf2a-ae3e-40c6-b198-d26d090b69c3',(select id from users where email='superadmin@superadmin.com'),'Servicios básicos','servicios-basicos',NULL),
	 ('713ad926-9fd9-4872-9023-2f91d50296e7',(select id from users where email='superadmin@superadmin.com'),'Shampoo','shampoo',NULL),
	 ('3351c77d-4e89-4741-acd1-96d49b07fe0a',(select id from users where email='superadmin@superadmin.com'),'Silla para comer para bebé','silla-comer-bebe',NULL),
	 ('bcf8add0-442c-4cff-b240-7c76ffeaab89',(select id from users where email='superadmin@superadmin.com'),'Tender de ropa','tender-ropa',NULL),
	 ('b066482d-3847-4816-b212-f533991a5857',(select id from users where email='superadmin@superadmin.com'),'Tocadiscos','tocadiscos',NULL),
	 ('5d1e7c58-92fe-4180-a40d-7ed72d41a314',(select id from users where email='superadmin@superadmin.com'),'Tostadora','tostadora',NULL),
	 ('a96a9475-2acf-4dcb-9fbc-4d2face6ff6b',(select id from users where email='superadmin@superadmin.com'),'TV','tv',NULL),
	 ('b69ae7fb-538e-4688-80cb-d1c8bf9de011',(select id from users where email='superadmin@superadmin.com'),'Una planta','una-planta',NULL),
	 ('2de7e511-068a-4340-916b-64b879ef38c2',(select id from users where email='superadmin@superadmin.com'),'Utensilios básicos de cocina','utensillos-basicos-cocina',NULL),
	 ('e239d39d-a6be-4dba-85f8-b404e0f9d32e',(select id from users where email='superadmin@superadmin.com'),'Utensilios para parrilla','utensillos-parrilla',NULL),
	 ('60b77b14-6692-456b-a154-aece35276841',(select id from users where email='superadmin@superadmin.com'),'Vajilla y cubiertos','vajilla-cubiertos',NULL),
	 ('86e718b5-26e7-418d-bf17-aef8444fe568',(select id from users where email='superadmin@superadmin.com'),'Ventilador portátil','ventilador-portatil',NULL),
	 ('203c2649-81f0-4ae1-80fb-a1bbe5261b5c',(select id from users where email='superadmin@superadmin.com'),'Ventilador de techo','ventilador-techo',NULL),
	 ('eceff825-294c-4257-b4c9-e2ce1c8e0e29',(select id from users where email='superadmin@superadmin.com'),'WiFi portátil','wifi-portatil',NULL),
	 ('cfd6db47-9779-4865-b2d0-73da7a053c43',(select id from users where email='superadmin@superadmin.com'),'WiFi','wifi',NULL),
	 ('06e4f0ea-2beb-4ed3-b116-5986b6498642',(select id from users where email='superadmin@superadmin.com'),'Zona para comer al aire libre','zona-comer-aire-libre',NULL),
	 ('81fcf591-9a32-4c69-8ab8-b9ba62182890',(select id from users where email='superadmin@superadmin.com'),'Zona de trabajo','zona-trabajo',NULL),
	 ('ec5df302-ef29-48e2-a1e5-fed53e8a7e24',(select id from users where email='superadmin@superadmin.com'),'Bar','bar',NULL),
	 ('448fb6ba-b4db-4b2d-943e-66650528fd34',(select id from users where email='superadmin@superadmin.com'),'Restaurante','restaurante',NULL);
`)

    await queryRunner.query(`INSERT INTO public.room (id,uid,"name",slug,img_cover_path,short_description,full_description,area,qty_pax,qty_bath,qty_rooms,is_open,img_cover_thumb_path) VALUES
	 ('c1262cff-f12b-4a01-b34d-926da77a3c6d',(select id from users where email='superadmin@superadmin.com'),'Los aparts','los-aparts','room/957d001f-8841-4d33-8b21-72b1d6b0ba08_1920-576.webp','Los aparts de 2 ambientes cuentan con entrada propia, cocina completa, amplio living y parrilla individual','Apart muy amplio y luminoso. Habitación y living con sofa cama. Anafe, microondas y heladera con freezer. Parrilla independiente con deck de madera. Salamandra y Spleet. Sommier King Size en dormitorio matrimonial, Pantalla eléctrica, Amplio placard, TV en ambos ambientes y un DVD. Baño completo con secador de pelo, sin bañera con box.',NULL,5,1,1,true,'room/957d001f-8841-4d33-8b21-72b1d6b0ba08_400-120.webp'),
	 ('a6b60667-6fec-4d92-a6fa-d26ef5b2382b',(select id from users where email='superadmin@superadmin.com'),'Loft','loft','room/6277aa22-9567-4f1d-ab69-0af2a0833515_1920-576.webp','Loft en planta alta muy amplio y luminoso, amplio living con grandes ventanales doble vidrios','Loft en planta alta muy amplio y luminoso, amplio living con grandes ventanales doble vidrios, baño completo con hidromasaje individual, sommier Queen 2Plaz, caja de seguridad, ventilador de techo, spleet, jarra eléctrica, TV-LCD, Frigobar y DVD',NULL,3,1,2,true,'room/6277aa22-9567-4f1d-ab69-0af2a0833515_400-120.webp'),
	 ('cbe95e1f-0dd7-4fde-965e-914485810af1',(select id from users where email='superadmin@superadmin.com'),'Las habitaciones','las-habitaciones','room/5b2a8776-8e77-4675-9ea3-894ca20392a3_1920-576.webp','Habitaciones en primer piso muy amplias y luminosas, con grandes ventanales de doble vidrio.','Habitaciones en primer piso muy amplias y luminosas, con grandes ventanales doble vidrios, baño completo, con hidromasaje individual y secador de pelo. Equipamiento de alta calidad: Sommier Queen 2Plaz, caja de seguridad, spleet, frigobar, jarra electrica, TV-LCD y DVD. Cuatro pax, dos ambientes con balcón terraza, todo en una sola planta. Living con sofa cama.',NULL,3,1,2,true,'room/5b2a8776-8e77-4675-9ea3-894ca20392a3_400-120.webp'),
	 ('b8d0e7ef-4a5d-418b-837e-ff35ac5553a1',(select id from users where email='superadmin@superadmin.com'),'Monoambientes','monoambientes','room/6db93f44-530c-4a5f-851e-0558b3ceecc6_1920-576.webp','Cinco monoambientes para dos pax, con salida y vista directa al mar y uno para cuatro pax','Cinco monoambientes para dos pax, con salida y vista directa al mar y uno para cuatro pax. Sommie Queen. Heladera, pequeña anafe, jarra electrica, caja de seguridad y vajilla completa. Spleet. Baño completo con secador de pelo. Para cuatro pax, habitacion matrimonial y living.',NULL,3,1,1,true,'room/6db93f44-530c-4a5f-851e-0558b3ceecc6_400-120.webp');
`)

    await queryRunner.query(`INSERT INTO public.room_equipment (id,uid,room_id,equipment_id) VALUES
	 ('e7698575-818e-4a3f-b56c-d1443a51bd98',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','aec75afa-92fc-48d3-92b3-e7b19bf80907'),
	 ('0ba69af8-354c-47a7-a6ca-a23fa9f27a01',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','26466e2d-1144-473f-83d6-0eac6afbb899'),
	 ('6708bba3-c48d-49d7-8b51-2a54bb8afcd5',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','0d5487d3-dc91-4dae-8fc3-ca546bd182b0'),
	 ('e52035f4-a18f-4284-aad1-52852f44ac4c',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','307c7a7b-728a-4408-8183-c5d715c99add'),
	 ('0505929d-da21-4363-b75d-856cf6a79733',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','189ce5ef-45b5-4190-a6cb-3cce4922444d'),
	 ('ddd0d660-ea5b-4a17-8abb-34ae52d0e205',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','b86da19c-7d74-427a-9a57-94773de4075b'),
	 ('4a8a1e6f-1bb4-4fcd-b412-64abbc46be06',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','51d4ae02-0c7b-4494-9e88-b38c7c9c9399'),
	 ('53e7812e-822a-4976-bcdf-6de02df5b4f9',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','7f42ef94-67c7-4d33-8118-1e7415bf8d11'),
	 ('d40fbfec-459f-46ff-b7ab-5a21c31c077a',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','ac828048-3cb7-4f2f-831a-929ec8cd2929'),
	 ('88cdceb6-db75-4ba1-9585-df85047d8b95',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','307c7a7b-728a-4408-8183-c5d715c99add'),
	 ('a6275461-a177-46a2-8991-9bfc887b318a',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','189ce5ef-45b5-4190-a6cb-3cce4922444d'),
	 ('aec00352-1521-442a-b7bd-e97780a767cd',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','546c87dd-e386-4448-a140-ae0873cb5a8c'),
	 ('8f74f6c5-780c-4fe8-9c53-d798bb91845a',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','638867a6-fd03-4395-82b5-55cbacfbfcc6'),
	 ('b2476912-02be-421b-bc3e-32d714594d0f',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','d43fc72b-1087-4ddd-aa68-7829f5be6d2a'),
	 ('c5b4ef16-d411-44bd-8353-179ca076d858',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','f797d28d-09da-4121-99fe-dac92fbf77fd'),
	 ('2b802779-bbc4-41ab-a935-f5b773407024',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','5c5a0e0c-cdd0-43f7-a974-d4c6b1deab2b'),
	 ('055de1cf-d959-4864-85c3-e61a1ade6496',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','089e7810-bad2-46ee-8ae8-7cf77c67d1cd'),
	 ('ca1e8899-6359-4704-8e45-b2526b20cf13',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','ee319997-4b92-4be5-a6ac-79ae5e6c5288'),
	 ('142d6b29-8e00-4c06-b513-f66eed6e7b9c',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','b86da19c-7d74-427a-9a57-94773de4075b'),
	 ('5416353e-91a7-4b99-84d9-ac8a003973d4',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','51d4ae02-0c7b-4494-9e88-b38c7c9c9399'),
	 ('f6f2cdb8-3005-4af3-93f7-417a54e85896',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','189ce5ef-45b5-4190-a6cb-3cce4922444d'),
	 ('dab64602-d8c0-4227-9b98-1cf66932f8f5',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','638867a6-fd03-4395-82b5-55cbacfbfcc6'),
	 ('8da0266f-5730-4e95-a47a-158d0d749e65',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','d43fc72b-1087-4ddd-aa68-7829f5be6d2a'),
	 ('35c65dca-3d99-4017-a54d-a6ce74f2e5e0',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','01a91697-19b5-4c2e-9423-50da9191d4ea'),
	 ('db9a9614-aabd-41b1-97b8-28a4af1eaa9a',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','f797d28d-09da-4121-99fe-dac92fbf77fd'),
	 ('fbe53e2c-5fab-44d5-ae1f-a21b629c89c4',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','7484f585-6730-4e4b-be35-724d7a6ba8a5'),
	 ('effd39d5-744e-44d7-b83e-7d5c921b1a8a',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','ee319997-4b92-4be5-a6ac-79ae5e6c5288'),
	 ('8c5851de-5ac8-419e-be3d-390b1fd1f7c3',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','b86da19c-7d74-427a-9a57-94773de4075b'),
	 ('bda08f17-3a6e-4a2c-ab40-5be40cf7408f',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','5145d163-6c76-4432-9a4d-86e105cf5a22'),
	 ('e3b131fe-2603-4296-a600-a7ab627c58eb',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','5c742b1a-a157-46f5-afde-a8670f80c640'),
	 ('43c106fd-d13b-473f-b956-28c37df67446',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','7f42ef94-67c7-4d33-8118-1e7415bf8d11'),
	 ('127ca972-8480-4784-8e29-eef2855858d8',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','7b68a37a-ee98-47c5-91e6-bdc7e539ef71'),
	 ('f5e02ba5-89cf-4511-b625-e82a28c69d72',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','638867a6-fd03-4395-82b5-55cbacfbfcc6'),
	 ('bd26a7cb-902c-4279-a9fc-53440f6d71ed',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','f797d28d-09da-4121-99fe-dac92fbf77fd'),
	 ('495603d1-6dbb-4251-b678-0d20dabf8eed',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','5c5a0e0c-cdd0-43f7-a974-d4c6b1deab2b'),
	 ('b134238c-7a75-4bc3-93da-cb0c8279f7af',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','ee319997-4b92-4be5-a6ac-79ae5e6c5288'),
	 ('7424bd1f-3353-455c-974c-1d83824d225c',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','5c742b1a-a157-46f5-afde-a8670f80c640'),
	 ('463172a6-9637-4b55-b571-11dca9623bbe',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','713ad926-9fd9-4872-9023-2f91d50296e7'),
	 ('244df7a0-b852-4557-b7dd-1ce0df3e58f0',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','3351c77d-4e89-4741-acd1-96d49b07fe0a'),
	 ('216df462-c8bf-4266-be75-91bf30ca812a',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','86e718b5-26e7-418d-bf17-aef8444fe568'),
	 ('58b8c409-7b1b-40e2-a31e-c9beaf3a45cb',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','203c2649-81f0-4ae1-80fb-a1bbe5261b5c'),
	 ('47779115-9f71-44c7-b337-3634e4522221',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','81fcf591-9a32-4c69-8ab8-b9ba62182890'),
	 ('317e0eb0-a9eb-4ad0-82c5-9d2061f4a3f5',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','ec5df302-ef29-48e2-a1e5-fed53e8a7e24'),
	 ('d79fb925-4e5d-417b-8542-65e1a21deef3',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','448fb6ba-b4db-4b2d-943e-66650528fd34');
`)

    await queryRunner.query(`INSERT INTO public.room_img (id,uid,room_id,img_path,img_thumb_path) VALUES
	 ('35c8869f-e82f-4f54-9dd8-9b0d4ef5c13a',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/7b43533a-05de-4c3b-a6a2-265aa3949ba0_1920-1280.webp','room_img/7b43533a-05de-4c3b-a6a2-265aa3949ba0_400-267.webp'),
	 ('ed6176fe-0c1f-42d9-97fa-facc7ee9b31d',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/7eef5b63-acbc-4e9c-ba28-9afd630f2794_1920-1275.webp','room_img/7eef5b63-acbc-4e9c-ba28-9afd630f2794_400-266.webp'),
	 ('eccc8408-05af-4859-8338-28affe56b5a1',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/cf428bae-ac18-45fa-8397-4aae40da0621_1920-1281.webp','room_img/cf428bae-ac18-45fa-8397-4aae40da0621_400-267.webp'),
	 ('8c6a6d57-5974-4027-9097-96964e828ee6',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/e189ec11-1f96-442a-8c46-4ca67266a3bf_1920-1280.webp','room_img/e189ec11-1f96-442a-8c46-4ca67266a3bf_400-267.webp'),
	 ('ecd211b5-f839-4230-ae9c-42647fc7d960',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/3af59432-8a2d-4915-8219-c8ee0dee93f4_1920-1280.webp','room_img/3af59432-8a2d-4915-8219-c8ee0dee93f4_400-267.webp'),
	 ('037db748-c7cc-4db8-8540-dfc71e7c5837',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/d21da142-7b82-42e4-a848-81e8c062837c_1920-1330.webp','room_img/d21da142-7b82-42e4-a848-81e8c062837c_400-277.webp'),
	 ('2deb367b-0921-424a-8377-c9a806303192',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/54440a42-1499-4d38-87ea-41014d1c663e_1920-1280.webp','room_img/54440a42-1499-4d38-87ea-41014d1c663e_400-267.webp'),
	 ('6484505d-3b1e-4336-8753-3b282b69ac6f',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/d19e0070-f163-4870-a6a8-10c1d3c2f0b4_1920-1280.webp','room_img/d19e0070-f163-4870-a6a8-10c1d3c2f0b4_400-267.webp'),
	 ('5a8f7c45-06bb-4031-9ba6-0849a86ab762',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/ad6701e6-e51e-4a98-adfb-4a43ba006a1a_720-1080.webp','room_img/ad6701e6-e51e-4a98-adfb-4a43ba006a1a_400-600.webp'),
	 ('aa3e1ab4-7484-4e4c-97fe-8c4a8da8b0f4',(select id from users where email='superadmin@superadmin.com'),'c1262cff-f12b-4a01-b34d-926da77a3c6d','room_img/70051dd0-b0b5-4d9b-86ee-be9d704e130f_720-1080.webp','room_img/70051dd0-b0b5-4d9b-86ee-be9d704e130f_400-600.webp'),
	 ('9c628267-498b-422d-9b6f-a608866e5ca8',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','room_img/ee258a21-c1d7-4f11-90fd-bd3ebf5a8fd9_1920-1280.webp','room_img/ee258a21-c1d7-4f11-90fd-bd3ebf5a8fd9_400-267.webp'),
	 ('eda3b0b9-9d64-44c4-a8f8-470e65a242b1',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','room_img/d94b3048-a213-4558-9a95-8444e1c087c9_1920-1281.webp','room_img/d94b3048-a213-4558-9a95-8444e1c087c9_400-267.webp'),
	 ('0c644e32-9572-42b4-b124-5fa1eb5aeded',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','room_img/e063f1a9-ccdf-4594-9f9f-fd3029994a43_1920-1275.webp','room_img/e063f1a9-ccdf-4594-9f9f-fd3029994a43_400-266.webp'),
	 ('b4d91d9e-91a7-40b3-9a8b-dfca54705365',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','room_img/580781b2-e865-4902-ae5e-fa4ba6d9f32a_720-1080.webp','room_img/580781b2-e865-4902-ae5e-fa4ba6d9f32a_400-600.webp'),
	 ('8f7d33fc-929e-4a24-88f9-4e0690839b5f',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','room_img/50a1090f-9527-4e48-8c95-3cd73836c05c_1920-1330.webp','room_img/50a1090f-9527-4e48-8c95-3cd73836c05c_400-277.webp'),
	 ('254a77be-01ae-4f03-a450-568fc87cee30',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','room_img/d0c7d396-8ae7-474e-91e0-b73a72889df1_1920-1280.webp','room_img/d0c7d396-8ae7-474e-91e0-b73a72889df1_400-267.webp'),
	 ('01db8e39-ea2f-4a4a-b36e-4f13057d03d3',(select id from users where email='superadmin@superadmin.com'),'cbe95e1f-0dd7-4fde-965e-914485810af1','room_img/67596a31-8b1c-4fd4-945d-aaa1492420c9_1920-1280.webp','room_img/67596a31-8b1c-4fd4-945d-aaa1492420c9_400-267.webp'),
	 ('c28684fb-5776-4167-b50b-028133aed6ee',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','room_img/10a6f3e4-cc19-4b30-a90e-69db47d88d8d_1920-1280.webp','room_img/10a6f3e4-cc19-4b30-a90e-69db47d88d8d_400-267.webp'),
	 ('730dbdea-4bd4-4f3f-afb4-771595829668',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','room_img/008cd632-24a7-4a76-b835-5d8c69d06813_720-1080.webp','room_img/008cd632-24a7-4a76-b835-5d8c69d06813_400-600.webp'),
	 ('8e036b6c-b227-42d5-9f70-906fa0f642c4',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','room_img/1e91a1b8-bc18-4690-95c2-6f0b9825f4ba_1920-1281.webp','room_img/1e91a1b8-bc18-4690-95c2-6f0b9825f4ba_400-267.webp'),
	 ('ecbe7d01-0410-48cc-8a1e-465d289258b7',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','room_img/a011b6ed-01a8-4268-add7-57724b7f07e7_1920-1275.webp','room_img/a011b6ed-01a8-4268-add7-57724b7f07e7_400-266.webp'),
	 ('528e8e6c-3389-468a-9461-b1a8f5075959',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','room_img/89fe1b67-50f2-4166-83c7-b80f6e9a42d5_1920-1280.webp','room_img/89fe1b67-50f2-4166-83c7-b80f6e9a42d5_400-267.webp'),
	 ('b4889fc3-6719-4e25-b73c-bb7d077d0550',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','room_img/de972d6c-4ef4-4986-a00d-504145db6f79_720-1080.webp','room_img/de972d6c-4ef4-4986-a00d-504145db6f79_400-600.webp'),
	 ('db4413f9-7b12-46cb-9f82-57eb5cd39162',(select id from users where email='superadmin@superadmin.com'),'b8d0e7ef-4a5d-418b-837e-ff35ac5553a1','room_img/a153cbb7-31d1-4f7e-9a72-c1b227cf5fac_1920-1330.webp','room_img/a153cbb7-31d1-4f7e-9a72-c1b227cf5fac_400-277.webp'),
	 ('f7fb21bd-e691-4a42-aa1b-38c1792a9413',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/96860747-ffd3-4619-9672-c8dd7fd311fe_1920-1280.webp','room_img/96860747-ffd3-4619-9672-c8dd7fd311fe_400-267.webp'),
	 ('4575db00-84ff-43f7-8cfa-96a9a5757aec',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/ed75f3ef-2745-41a6-aa58-5f8305b9ba9f_1920-1275.webp','room_img/ed75f3ef-2745-41a6-aa58-5f8305b9ba9f_400-266.webp'),
	 ('3018fbf0-31bc-4a67-84e1-40fb3528a76e',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/22aa87a9-eee0-4e2c-85fc-73b140bb626a_1920-1281.webp','room_img/22aa87a9-eee0-4e2c-85fc-73b140bb626a_400-267.webp'),
	 ('03e9e3e7-5d19-4532-92ce-33a8a7d8724d',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/b5fe0d56-f74e-427e-aa65-c93bc756ffea_1920-1280.webp','room_img/b5fe0d56-f74e-427e-aa65-c93bc756ffea_400-267.webp'),
	 ('54994c52-afa7-4019-910b-7676752271f1',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/8f9294dd-ac82-4175-b809-1a340c83a880_1920-1280.webp','room_img/8f9294dd-ac82-4175-b809-1a340c83a880_400-267.webp'),
	 ('f6a52eb6-329a-4631-a20c-4c1e50c7c890',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/2380fbf8-b135-4358-8d49-e3e5f30b07c4_1920-1330.webp','room_img/2380fbf8-b135-4358-8d49-e3e5f30b07c4_400-277.webp'),
	 ('f409cf06-e5be-41db-9c78-d534e61d59af',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/73037087-3b78-4f27-bec8-d8cb1373e708_1920-1280.webp','room_img/73037087-3b78-4f27-bec8-d8cb1373e708_400-267.webp'),
	 ('bae0bdb0-f980-45d0-9176-18f5755d7d97',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/2c511d7b-c9ea-4193-a03e-03a58c662d4f_1920-1280.webp','room_img/2c511d7b-c9ea-4193-a03e-03a58c662d4f_400-267.webp'),
	 ('cd9bde66-ff06-4fd7-9727-bc3c907d48e7',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/fe20f89f-5277-4d02-8ad0-62977fcc416d_720-1080.webp','room_img/fe20f89f-5277-4d02-8ad0-62977fcc416d_400-600.webp'),
	 ('03819ba6-1de6-4ce8-8bee-f9dd17d00cf4',(select id from users where email='superadmin@superadmin.com'),'a6b60667-6fec-4d92-a6fa-d26ef5b2382b','room_img/f0b5fe71-fc84-465a-aa56-1a0a46e5cec8_720-1080.webp','room_img/f0b5fe71-fc84-465a-aa56-1a0a46e5cec8_400-600.webp');
`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(``)
  }
}
