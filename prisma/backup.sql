--
-- PostgreSQL database dump
--

\restrict qpRWShZArPufFLXCxALv4xynvfPPZA5KtHMhT7KvUDnhSVJzGzZmfBK0TxP6QnW

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: OcrStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OcrStatus" AS ENUM (
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public."OcrStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: OcrRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OcrRequest" (
    id text NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    status public."OcrStatus" DEFAULT 'QUEUED'::public."OcrStatus" NOT NULL,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OcrRequest" OWNER TO postgres;

--
-- Name: OcrResult; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OcrResult" (
    id text NOT NULL,
    "requestId" text NOT NULL,
    text text NOT NULL,
    "rawResponse" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OcrResult" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: OcrRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OcrRequest" (id, "fileName", "filePath", status, "retryCount", "errorMessage", "createdAt", "updatedAt") FROM stdin;
ccb97c1a-0c9f-477d-a87a-55cfa55ec017	GnMmVF_acAA8sYA 2.jpg	/ocr/GnMmVF_acAA8sYA 2.jpg	FAILED	0	ENOENT: no such file or directory, open '/ocr/GnMmVF_acAA8sYA 2.jpg'	2026-05-16 07:47:43.774	2026-05-16 07:47:44.058
e9190492-4a50-4d67-8474-23e4ad1814af	GnMmVF_acAA8sYA 2.jpg	/ocr/GnMmVF_acAA8sYA 2.jpg	FAILED	0	ENOENT: no such file or directory, open '/ocr/GnMmVF_acAA8sYA 2.jpg'	2026-05-16 07:54:15.773	2026-05-16 07:54:16.072
040eb8a2-8300-4363-87b1-6f8b8efb1a34	GnMmVF_acAA8sYA 2.jpg	ocr/undefined	FAILED	0	ENOENT: no such file or directory, open 'ocr/undefined'	2026-05-16 07:56:25.49	2026-05-16 07:56:25.815
d2d18a59-9be1-4f0e-a80f-b60c67a1f9ea	GnMmVF_acAA8sYA 2.jpg	ocr/GnMmVF_acAA8sYA 2.jpg	FAILED	0	ENOENT: no such file or directory, open 'ocr/GnMmVF_acAA8sYA 2.jpg'	2026-05-16 07:59:58.059	2026-05-16 07:59:58.338
af2cb98f-1c0c-4e13-b3d9-3fcb92b41f0a	GnMmVF_acAA8sYA 2.jpg	uploads/1778919072724-GnMmVF_acAA8sYA 2.jpg	FAILED	0	Request failed with status code 422	2026-05-16 08:11:12.748	2026-05-16 08:11:13.448
0d00e429-5ecc-409f-bffb-f78dadc86a0e	images 1.jpg	uploads/1778919587734-images 1.jpg	FAILED	0	Request failed with status code 422	2026-05-16 08:19:47.759	2026-05-16 08:19:48.428
b2e53915-5adf-4745-bc15-b229143e9337	images 1.jpg	uploads/1778919724556-images 1.jpg	FAILED	0	Request failed with status code 500	2026-05-16 08:22:04.578	2026-05-16 08:22:05.691
\.


--
-- Data for Name: OcrResult; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OcrResult" (id, "requestId", text, "rawResponse", "createdAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b830e496-75c0-47e5-a59a-ab302cf59e1a	5f7cda50faf8eb068a304f17c99ed205c5d581f435dfda8ddf3d15d381954645	2026-05-16 09:03:37.795163+05:45	20260516031837_init	\N	\N	2026-05-16 09:03:37.772877+05:45	1
\.


--
-- Name: OcrRequest OcrRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OcrRequest"
    ADD CONSTRAINT "OcrRequest_pkey" PRIMARY KEY (id);


--
-- Name: OcrResult OcrResult_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OcrResult"
    ADD CONSTRAINT "OcrResult_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: OcrResult_requestId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "OcrResult_requestId_key" ON public."OcrResult" USING btree ("requestId");


--
-- Name: OcrResult OcrResult_requestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OcrResult"
    ADD CONSTRAINT "OcrResult_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES public."OcrRequest"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict qpRWShZArPufFLXCxALv4xynvfPPZA5KtHMhT7KvUDnhSVJzGzZmfBK0TxP6QnW

