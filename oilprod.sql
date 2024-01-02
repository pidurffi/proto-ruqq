DO $$ 
DECLARE 
  uid UUID;
  fecha_alta DATE;
BEGIN
	uid := (select id from users where email='superadmin@superadmin.com');
	fecha_alta := '2023-11-01';
	/* Borro datos */
	delete from derivado_recibido where fecha >= fecha_alta;
	delete from downtime  where fecha >= fecha_alta;
	delete from entrega where fecha >= fecha_alta;
	delete from inyeccion_purga where fecha >= fecha_alta;
	delete from planta_gas where fecha >= fecha_alta;
	delete from potencial where fecha >= fecha_alta;
	delete from potencial_inyeccion where fecha >= fecha_alta;
	delete from pozo_estado_actual where fecha >= fecha_alta;
    delete from separador_diario where fecha >= fecha_alta-10;
    delete from stock_regulado_diario where fecha >= fecha_alta-10;
	delete from tanque_diario  where fecha >= fecha_alta-10;
	delete from distribucion_por_capas where fecha >= fecha_alta-10;
	/* PARÁMETROS */
	-- Batería
	delete from pozo where created_at >= fecha_alta;
	delete from separador where created_at >= fecha_alta;
	delete from tanque where created_at >= fecha_alta;
	delete from bateria where created_at >= fecha_alta;
	INSERT INTO bateria (uid, descripcion, alias, tipo_bateria, habilitado)
	values (uid, 'Plataforma A', 'Plat A', 1, true),
			(uid, 'Plataforma B', 'Plat B', 1, true),
			(uid, 'Plataforma C', 'Plat C', 1, true),
			(uid, 'Plataforma D', 'Plat D', 1, true),
			(uid, 'Plataforma E', 'Plat E', 1, true),
			(uid, 'Bateria Noz',  'Bateria Noz', 1, true),
			(uid, 'Planta Castanha','Planta Castanha', 2, true);
	-- Bloque
	delete from bloque where created_at >= fecha_alta;
	INSERT INTO bloque (uid, descripcion, alias)
	values  (uid, 'Cabinda Sul', 'Cabinda Sul'),
			(uid, 'Cabinda', 'Cabinda');
	-- Capa
	delete from capa where created_at >= fecha_alta;
	INSERT INTO capa (uid, nombre, alias, tipo_capa, tope_formacion, base_formacion)
	values  (uid, 'Chela Inferior', 'Chela inf.', 'Primaria', '', ''),
			(uid, 'Vermelha', 'Vermelha', 'Primaria', '', '');
	-- Causas downtime
	delete from causa_downtime_nivel_6 where created_at >= fecha_alta;
	delete from causa_downtime_nivel_5 where created_at >= fecha_alta;
	delete from causa_downtime_nivel_4 where created_at >= fecha_alta;
	delete from causa_downtime_nivel_3 where created_at >= fecha_alta;
	delete from causa_downtime_nivel_2 where created_at >= fecha_alta;
	delete from causa_downtime_nivel_1 where created_at >= fecha_alta;
	/* FALTA CARGAR LAS CAUSAS DE DOWNTIME REALES  */
	-- nivel 1
	INSERT INTO causa_downtime_nivel_1 (uid, descripcion, alias, observaciones)
	values (uid, 'CN1', 'CN1', '');
	-- nivel 2
	INSERT INTO causa_downtime_nivel_2 (uid, descripcion, alias, observaciones, causa_downtime_nivel1_id)
	values (uid, 'CN2', 'CN2', '', (select id from causa_downtime_nivel_1 where descripcion = 'CN1'));
	-- nivel 3
	INSERT INTO causa_downtime_nivel_3 (uid, descripcion, alias, observaciones, causa_downtime_nivel2_id)
	values (uid, 'CN3', 'CN3', '', (select id from causa_downtime_nivel_2 where descripcion = 'CN2'));
	-- nivel 4
	INSERT INTO causa_downtime_nivel_4 (uid, descripcion, alias, observaciones, causa_downtime_nivel3_id)
	values (uid, 'CN4', 'CN4', '', (select id from causa_downtime_nivel_3 where descripcion = 'CN3'));
	-- nivel 5
	INSERT INTO causa_downtime_nivel_5 (uid, descripcion, alias, observaciones, causa_downtime_nivel4_id)
	values (uid, 'CN5', 'CN5', '', (select id from causa_downtime_nivel_4 where descripcion = 'CN4'));
	-- nivel 6
	INSERT INTO causa_downtime_nivel_6 (uid, descripcion, alias, observaciones, plan, tipo, causa_downtime_nivel5_id)
	values (uid, 'CN6', 'CN6', '', 'Planeada', 'Downtime', (select id from causa_downtime_nivel_5 where descripcion = 'CN5'));
	-- Cliente
	delete from cliente where created_at >= fecha_alta;
	INSERT INTO cliente (uid, nombre_cliente)
	values (uid, 'Malongo - Chevron'),
	(uid, 'Noz - Malongo - Chevron');
	-- Clientes_productos (asociación de productos a clientes)
	delete from clientes_productos /*where created_at >= fecha_alta*/;
	INSERT INTO clientes_productos(cliente_id,producto_id )
	values	((select id from cliente where nombre_cliente='Malongo - Chevron'), 	  (select id from producto where alias_id=1)),
			((select id from cliente where nombre_cliente='Noz - Malongo - Chevron'), (select id from producto where alias_id=1)),
			/* Creo una asociación con propano para generar una entrega falsa. */
			((select id from cliente where nombre_cliente='Noz - Malongo - Chevron'), (select id from producto where alias_id=3));
	-- Cliente derivado/recibido
	delete from cliente_derivado_recibido  where created_at >= fecha_alta;
	INSERT INTO cliente_derivado_recibido (uid, descripcion, alias, tipo)
	values	(uid, 'Derivado Vta Malongo-Chevron (Castanha)', 'Derivado Vta Malongo-Chevron (Castanha)', 1),
			(uid, 'Derivado Vta Malongo-Chevron (Noz)', 'Derivado Vta Malongo-Chevron (Noz)', 1),
			(uid, 'Recibido Noz', 'Recibido Noz', 2);
	-- Compresor
	delete from compresor where created_at >= fecha_alta;
	INSERT INTO compresor (uid, nombre, alias)
	values (uid, 'Compressor de Gás Lift', 'KAE-001');
	-- Yacimiento
	delete from yacimiento where created_at >= fecha_alta;
	INSERT INTO yacimiento (uid, descripcion, alias)
	values (uid, 'Cabinda South','Cabinda South'),
		(uid, 'Amêndoa','Amêndoa'),
		(uid, 'Castanha','Castanha'),
		(uid, 'Massambala','Massambala'),
		(uid, 'Unknown','Unknown'),
		(uid, 'Noz','Noz');
	-- Sistema de extracción
	delete from sistema_extraccion where created_at >= fecha_alta;
	INSERT INTO sistema_extraccion (uid, alias_id, descripcion, alias)
	values (uid, 1, 'Surgente','SUR'),
		(uid, 3,'Bombeo Mecánico','BM'),
		(uid, 4,'Bombeo Hidráulico','BH'),
		(uid, 5,'Electro Sumergible','ESM'),
		(uid, 7,'Gas Lift','GL'),
		(uid, 8,'PCP','PCP'),
		(uid, 9,'Plunger Lift','PL'),
		(uid, 10,'Otros','OTR'),
		(uid, 11,'Sin Sist. Extracción','SSE');
	-- Pozo
	delete from pozo where created_at >= fecha_alta;
	INSERT INTO pozo (uid, uwi,common_well, well_name,xcoo,ycoo,latitud,longitud,x_posgar,y_posgar,elev_type,total_Depth,pais,provincia,cuenca,ciudad,
		fecha_inicio_perforacion, fecha_inicio_terminacion, fecha_fin_terminacion, fecha_abandono, observaciones,
	    fecha_salida, fecha_ingreso, fecha_conversion,sistema_extraccion_id,satelite_id, estado_pozo_inicial_id,
	    estado_pozo_anterior_id,bateria_id,compresor_id,bloque_id,yacimiento_id)
		values  (uid,'Castanha-8','Castanha-8','Castanha-8',195687.14, 9380286.76, 195687.14, 9380286.761, 12.25322929, -5.6001175,  42.44, 2388.10, 'ANGOLA','CABINDA','LOWER CONGO','',NULL,NULL,NULL,NULL,'',null,null,null, (select id from sistema_extraccion  where alias_id = 7), NULL,null,null, (select id from bateria where descripcion = 'Plataforma B'), (select id from compresor where nombre = 'Compressor de Gás Lift'), (select id from bloque where descripcion = 'Cabinda Sul'), (select id from yacimiento where descripcion = 'Castanha')),
			(uid,'Castanha-9','Castanha-9','Castanha-9',195835.01, 9382602.02, 195835.01, 9382602.026, 12.25466048, -5.57920301, 48.47, 2382.21, 'ANGOLA','CABINDA','LOWER CONGO','',NULL,NULL,NULL,NULL,'',NULL,null,NULL, (select id from sistema_extraccion  where alias_id = 5), NULL,null,null, (select id from bateria where descripcion = 'Plataforma E'), (select id from compresor where nombre = 'Compressor de Gás Lift'), (select id from bloque where descripcion = 'Cabinda Sul'), (select id from yacimiento where descripcion = 'Castanha')),
			(uid,'Castanha-4','Castanha-4','Castanha-4',195683.88, 9380303.86, 195683.88, 9380303.86,  12.25320062, -5.59996285, 42.60, 2348.00, 'ANGOLA','CABINDA','LOWER CONGO','',NULL,NULL,NULL,NULL,'',null,NULL,null, (select id from sistema_extraccion  where alias_id = 7), NULL,null,null, (select id from bateria where descripcion = 'Plataforma B'), (select id from compresor where nombre = 'Compressor de Gás Lift'), (select id from bloque where descripcion = 'Cabinda Sul'), (select id from yacimiento where descripcion = 'Castanha')),
			(uid,'Castanha-5','Castanha-5','Castanha-5',195773.75, 9381786.60, 195773.75, 9381786.604, 12.25407363, -5.58656859, 54.13, 2320.00, 'ANGOLA','CABINDA','LOWER CONGO','',NULL,NULL,NULL,NULL,'',NULL,null,NULL, (select id from sistema_extraccion  where alias_id = 5), NULL,null,null, (select id from bateria where descripcion = 'Plataforma C'), (select id from compresor where nombre = 'Compressor de Gás Lift'), (select id from bloque where descripcion = 'Cabinda Sul'), (select id from yacimiento where descripcion = 'Castanha')),
			(uid,'Castanha-6','Castanha-6','Castanha-6',197255.90, 9381667.80, 197255.9,  9381667.8,   12.26743607, -5.58770449, 53.08, 2372.00, 'ANGOLA','CABINDA','LOWER CONGO','',NULL,NULL,NULL,NULL,'',NULL,null,NULL, (select id from sistema_extraccion  where alias_id = 11),NULL,null,null, (select id from bateria where descripcion = 'Plataforma A'), (select id from compresor where nombre = 'Compressor de Gás Lift'), (select id from bloque where descripcion = 'Cabinda Sul'), (select id from yacimiento where descripcion = 'Castanha'));
	-- Separador
	delete from separador where created_at  >= fecha_alta;
	insert into separador(uid,"Nombre", "Alias", "Habilitado", "Observaciones",bateria_id)
	values(uid,'V-001','FWKO',false,'',(select id from bateria where descripcion='Planta Castanha')),
	      (uid,'SK-002','Heater Trater',false,'',(select id from bateria where descripcion='Planta Castanha')),
	      (uid,'SK-003','Desalter',true,'',(select id from bateria where descripcion='Planta Castanha'));
	-- stock regulado
	delete from stock_regulado  where created_at >= fecha_alta;
	INSERT INTO public.stock_regulado (uid, nombre, habilitado, observaciones, tipo_stock_regulado)
	VALUES(uid, 'PTF-A', true, '', 'Líneas'),
	(uid, 'PTF-B', true, '', 'Líneas'),
	(uid, 'PTF-C & E', true, '', 'Líneas'),
	(uid, 'Oleoducto Malongo', true, '', 'Oleoductos');
	-- Tanque
	INSERT INTO tanque (uid, nombre, alias, habilitado, observaciones, bateria_id, tipo_de_tanque)
	values (uid,'Tk-001','Tanque de venda',true,'',(select id from bateria where descripcion='Planta Castanha'),'Con producto en especificación'),
	(uid,'Tk-002','Reprocesso',true,'',(select id from bateria where descripcion='Planta Castanha'),'Sin producto en especificación'),
	(uid,'Tk-201','Slop Tank',true,'',(select id from bateria where descripcion='Planta Castanha'),'Sin producto en especificación'),
	(uid,'Tk-101','Surge Tank',true,'',(select id from bateria where descripcion='Planta Castanha'),'Sin producto en especificación'),
	(uid,'Tk-102','Agua de Produção',true,'',(select id from bateria where descripcion='Planta Castanha'),'Sin producto en especificación'),
	(uid,'PTF-A','Tanque Preto A',false,'',(select id from bateria where descripcion='Plataforma A'),'Sin producto en especificación'),
	(uid,'PTF-B','Tanque Preto B',true,'',(select id from bateria where descripcion='Plataforma B'),'Sin producto en especificación'),
	(uid,'PTF-C','Tanque Preto C',true,'',(select id from bateria where descripcion='Plataforma C'),'Sin producto en especificación'),
	(uid,'PTF-D','Tanque Preto D',false,'',(select id from bateria where descripcion='Plataforma D'),'Sin producto en especificación'),
	(uid,'PTF-Noz1','Tanque Preto Noz-01',false,'',(select id from bateria where descripcion='Bateria Noz'),'Sin producto en especificación');
	-- Distribución por capa
	INSERT INTO distribucion_por_capas(uid, fecha, coeficiente_oil_primaria, coeficiente_gas_primaria, coeficiente_agua_primaria, coeficiente_oil_secundaria, coeficiente_inyeccion_agua, coeficiente_inyeccion_gas, coeficiente_agua_secundaria, coeficiente_inyeccion_purga, observaciones, pozo_id, capa_id)
	values	(uid, fecha_alta, 1, 1, 1, 0, 0, 0, 0, 0, '', (select id from pozo where uwi='Castanha-8'), (select id from capa where nombre='Chela Inferior')),
			(uid, fecha_alta, 1, 1, 1, 0, 0, 0, 0, 0, '', (select id from pozo where uwi='Castanha-9'), (select id from capa where nombre='Chela Inferior')),
			(uid, fecha_alta, 1, 1, 1, 0, 0, 0, 0, 0, '', (select id from pozo where uwi='Castanha-4'), (select id from capa where nombre='Chela Inferior')),
			(uid, fecha_alta, 1, 1, 1, 0, 0, 0, 0, 0, '', (select id from pozo where uwi='Castanha-5'), (select id from capa where nombre='Chela Inferior')),
			(uid, fecha_alta, 0, 0, 0, 0, 0, 0, 0, 1, '', (select id from pozo where uwi='Castanha-6'), (select id from capa where nombre='Vermelha'));
END $$;
DO $$ 
DECLARE 
  uid UUID;
  fecha_parte_diario DATE;
BEGIN
	uid := (select id from users where email='superadmin@superadmin.com');
	fecha_parte_diario := '2023-11-01';
	/* DATOS */
	-- Derivado/Recibido
	INSERT INTO derivado_recibido (uid, fecha, volumen, de_terceros, tipo, cliente_derivado_recibido_id, producto_id)
	values (uid, fecha_parte_diario, 1.0, false, 1, (select id from cliente_derivado_recibido where descripcion='Derivado Vta Malongo-Chevron (Castanha)'), (select id from producto where alias_id = 1)),
	(uid, fecha_parte_diario, 2.0, false, 2, (select id from cliente_derivado_recibido where descripcion='Recibido Noz'), (select id from producto where alias_id = 1));
	-- downtime
	INSERT INTO downtime(uid, fecha, horas, oil, gas, agua, inyeccion_agua, inyeccion_purga, observaciones, pozo_id, causa_downtime_nivel6_id)
	values  (uid, fecha_parte_diario, 8.833333333334, 50.79, 77.66, 30.18, 0, 0, '', (select id from pozo where uwi='Castanha-4'), (select id from causa_downtime_nivel_6 where descripcion='CN6')),
			(uid, fecha_parte_diario, 3.583333333333, 11.5, 60.319, 12.99, 0, 0, '', (select id from pozo where uwi='Castanha-8'), (select id from causa_downtime_nivel_6 where descripcion='CN6')),
			(uid, fecha_parte_diario, 24, 138, 180, 487, 0, 0, '', (select id from pozo where uwi='Castanha-9'), (select id from causa_downtime_nivel_6 where descripcion='CN6'));
	-- Entrega
	INSERT INTO entrega (uid, fecha, certificado_nro, cantidad, cliente_id, producto_id, tipo_entrega_id)
	values (uid, fecha_parte_diario, 'CERT-01', 10.12, (select id from cliente where nombre_cliente ='Malongo - Chevron'), (select id from producto where alias_id = 1), (select id from tipo_entrega where alias_id = 1)),
	(uid, fecha_parte_diario, 'CERT-02', 11.23, (select id from cliente where nombre_cliente ='Noz - Malongo - Chevron'), (select id from producto where alias_id = 1), (select id from tipo_entrega where alias_id = 1)),
	/* Entrega falsa de tipo "de terceros diferida" */
	(uid, fecha_parte_diario, 'CERT-NO-PROPIA', 9.99, (select id from cliente where nombre_cliente ='Noz - Malongo - Chevron'), (select id from producto where alias_id = 1), (select id from tipo_entrega where alias_id = 3)),
	/* Entrega false de propano */
	(uid, fecha_parte_diario, 'CERT-PROPANO', 8.88, (select id from cliente where nombre_cliente ='Noz - Malongo - Chevron'), (select id from producto where alias_id = 3), (select id from tipo_entrega where alias_id = 1));
	-- Inyección purga
	INSERT INTO inyeccion_purga(uid, fecha, horas, caudal_instantaneo, caudal_inyectado, presion, presion_entre_columnas, cantidad_de_bombas, frecuencia, temperatura, observaciones, pozo_id)
	VALUES(uid, fecha_parte_diario, 24,2137,2137,620,null,1,30,37,'',(select id from pozo where uwi='Castanha-6'));
	-- Planta gas
	INSERT INTO planta_gas (uid, fecha, consumo)
	values (uid, fecha_parte_diario, 85.038);
	-- Potencial
	INSERT INTO potencial (uid, fecha, bruta, neta, gas, pozo_id, sistema_extraccion_id)
	values (uid, fecha_parte_diario, 220,138,211,  (select id from pozo where uwi='Castanha-4'),(select sistema_extraccion_id from pozo where uwi='Castanha-4')),
	       (uid, fecha_parte_diario, 572,154.3,182,(select id from pozo where uwi='Castanha-5'),(select sistema_extraccion_id from pozo where uwi='Castanha-5')),
	       (uid, fecha_parte_diario, 164,77,404,   (select id from pozo where uwi='Castanha-8'),(select sistema_extraccion_id from pozo where uwi='Castanha-8')),
	       (uid, fecha_parte_diario, 625,138,180,  (select id from pozo where uwi='Castanha-9'),(select sistema_extraccion_id from pozo where uwi='Castanha-9'));
   -- potencial, inyección
   insert into potencial_inyeccion(uid,fecha,agua,purga,presion,presion_entre_columnas,cantidad_de_bombas,observaciones,pozo_id)
   values(uid,fecha_parte_diario,0,400,825,0,1,'',(select id from pozo where uwi='Castanha-6'));
  --Pozo estado actual
   insert into pozo_estado_actual (uid,fecha,estado_pozo_id,pozo_id)
   values(uid,fecha_parte_diario,(select id from estado_pozo where alias_id=1),(select id from pozo where uwi='Castanha-8')),
         (uid,fecha_parte_diario,(select id from estado_pozo where alias_id=1),(select id from pozo where uwi='Castanha-9')),
         (uid,fecha_parte_diario,(select id from estado_pozo where alias_id=1),(select id from pozo where uwi='Castanha-4')),
         (uid,fecha_parte_diario,(select id from estado_pozo where alias_id=1),(select id from pozo where uwi='Castanha-5')),
         (uid,fecha_parte_diario,(select id from estado_pozo where alias_id=16),(select id from pozo where uwi='Castanha-6'));
	-- Separador diario (día actual y anterior)
	INSERT INTO separador_diario (uid, fecha, stock, stock_ajustado, observaciones, separador_id, bateria_id)
	 VALUES(uid,fecha_parte_diario, 76.4, null, '', (select id from separador where "Nombre"='SK-003'),(select id from bateria where descripcion='Planta Castanha')),
	       (uid, fecha_parte_diario - 1, 76.4, 76.4, '', (select id from separador where "Nombre"='SK-003'),(select id from bateria where descripcion='Planta Castanha'));
	-- stock regulado diario
	INSERT INTO stock_regulado_diario(uid, fecha, stock, observaciones, stock_regulado_id)
	VALUES(uid,fecha_parte_diario, 400, '', (select id from stock_regulado where nombre='PTF-B')),
	(uid,fecha_parte_diario, 9710, '', (select id from stock_regulado where nombre='Oleoducto Malongo')),
	(uid,fecha_parte_diario, 168.8, '', (select id from stock_regulado where nombre='PTF-C & E')),
	(uid,fecha_parte_diario, 57.5, '', (select id from stock_regulado where nombre='PTF-A'));
	-- tanque_diario (día actual y anterior)
	INSERT INTO tanque_diario(uid, fecha, stock, stock_ajustado, observaciones, "tanqueID", "bateriaID")
	values	(uid, fecha_parte_diario, 3204, null, '',  		(select id from tanque where nombre = 'Tk-001'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario, 233, null, '',   		(select id from tanque where nombre = 'Tk-002'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario, 132.5, null, '', 		(select id from tanque where nombre = 'Tk-201'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario, 0, null, '',     		(select id from tanque where nombre = 'Tk-101'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario, 0, null, '',     		(select id from tanque where nombre = 'Tk-102'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario, 91.5, null, '',  		(select id from tanque where nombre = 'PTF-C'),  (select id from bateria where descripcion ='Plataforma B')),
			(uid, fecha_parte_diario, 62, null, '',    		(select id from tanque where nombre = 'PTF-D'),  (select id from bateria where descripcion ='Plataforma C')),
			(uid, fecha_parte_diario - 1, 2928, 2928, '',   (select id from tanque where nombre = 'Tk-001'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario - 1, 234, 234, '',     (select id from tanque where nombre = 'Tk-002'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario - 1, 100.5, 100.5, '', (select id from tanque where nombre = 'Tk-201'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario - 1, 0, 0, '',         (select id from tanque where nombre = 'Tk-101'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario - 1, 0, 0, '',         (select id from tanque where nombre = 'Tk-102'), (select id from bateria where descripcion ='Planta Castanha')),
			(uid, fecha_parte_diario - 1, 91.5, 91.5, '',   (select id from tanque where nombre = 'PTF-C'),  (select id from bateria where descripcion ='Plataforma B')),
			(uid, fecha_parte_diario - 1, 62, 62, '',       (select id from tanque where nombre = 'PTF-D'),  (select id from bateria where descripcion ='Plataforma C'));
END $$;