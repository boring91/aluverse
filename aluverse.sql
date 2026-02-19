--
-- PostgreSQL database dump
--

\restrict zhbhy2mJF1UALqvUfznKOttFiFcLA8O3glsoSdzhD1ZpSf3bSQD3vPOFAHugcxJ

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg13+2)
-- Dumped by pg_dump version 18.1 (Debian 18.1-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: reconciliation_budget_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reconciliation_budget_category AS ENUM (
    'subscription',
    'consumable',
    'toll',
    'tool',
    'food',
    'salary',
    'fuel'
);


ALTER TYPE public.reconciliation_budget_category OWNER TO postgres;

--
-- Name: reconciliation_group; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reconciliation_group AS ENUM (
    'budget',
    'project',
    'loan',
    'tax',
    'refund',
    'refunded',
    'unclassified'
);


ALTER TYPE public.reconciliation_group OWNER TO postgres;

--
-- Name: reconciliation_project_stream; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reconciliation_project_stream AS ENUM (
    'supplies',
    'labors',
    'misc',
    'payments'
);


ALTER TYPE public.reconciliation_project_stream OWNER TO postgres;

--
-- Name: financial_account_bank_syncers; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.financial_account_bank_syncers AS ENUM (
    'westpac'
);


ALTER TYPE public.financial_account_bank_syncers OWNER TO postgres;

--
-- Name: loan_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.loan_type AS ENUM (
    'lent',
    'borrowed'
);


ALTER TYPE public.loan_type OWNER TO postgres;

--
-- Name: transaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transaction_type AS ENUM (
    'income',
    'expense'
);


ALTER TYPE public.transaction_type OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


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
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp without time zone,
    refresh_token_expires_at timestamp without time zone,
    scope text,
    password text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: reconciliations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reconciliations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    transaction_id uuid NOT NULL,
    amount integer NOT NULL,
    is_gst boolean NOT NULL,
    reconciliation_group public.reconciliation_group NOT NULL,
    budget_category public.reconciliation_budget_category,
    project_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    description character varying(1024),
    project_stream public.reconciliation_project_stream,
    project_item_id uuid,
    loan_id uuid,
    is_payoff boolean,
    loan_payoff_id uuid,
    CONSTRAINT budget_category_check_constraint CHECK (((reconciliation_group <> 'budget'::public.reconciliation_group) OR (budget_category IS NOT NULL))),
    CONSTRAINT loan_id_check_constraint CHECK (((reconciliation_group <> 'loan'::public.reconciliation_group) OR (loan_id IS NOT NULL))),
    CONSTRAINT loan_payoff_check_constraint CHECK (((is_payoff IS NOT TRUE) OR (loan_payoff_id IS NOT NULL))),
    CONSTRAINT project_id_check_constraint CHECK (((reconciliation_group <> 'project'::public.reconciliation_group) OR (project_id IS NOT NULL)))
);


ALTER TABLE public.reconciliations OWNER TO postgres;

--
-- Name: financial_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.financial_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    sync_with_bank public.financial_account_bank_syncers
);


ALTER TABLE public.financial_accounts OWNER TO postgres;

--
-- Name: loan_payoffs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loan_payoffs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    loan_id uuid NOT NULL,
    amount integer NOT NULL,
    date date NOT NULL,
    notes text,
    reconciliation_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.loan_payoffs OWNER TO postgres;

--
-- Name: loans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.loans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public.loan_type NOT NULL,
    party_name character varying(1024) NOT NULL,
    amount integer NOT NULL,
    date date NOT NULL,
    due_date date,
    notes text,
    reconciliation_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.loans OWNER TO postgres;

--
-- Name: project_labors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_labors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name character varying(1024) NOT NULL,
    hours integer NOT NULL,
    rate integer NOT NULL,
    reconciliation_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_labors OWNER TO postgres;

--
-- Name: project_misc; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_misc (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name character varying(1024) NOT NULL,
    amount integer NOT NULL,
    reconciliation_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_misc OWNER TO postgres;

--
-- Name: project_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    amount integer NOT NULL,
    date date NOT NULL,
    reconciliation_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_payments OWNER TO postgres;

--
-- Name: project_supplies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.project_supplies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name character varying(1024) NOT NULL,
    quantity integer NOT NULL,
    unit_price integer NOT NULL,
    reconciliation_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_supplies OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    human_id character varying(32) NOT NULL,
    client character varying(1024) NOT NULL,
    title character varying(1024) NOT NULL,
    visit_date date,
    start_date date,
    end_date date,
    address text,
    meters double precision,
    price integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    margin double precision NOT NULL,
    budget_units double precision CONSTRAINT projects_budget_unit_not_null NOT NULL,
    budget_unit_value integer NOT NULL
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    description character varying(1024) NOT NULL,
    amount integer NOT NULL,
    type public.transaction_type NOT NULL,
    account_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    image text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verifications (
    id text NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.verifications OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	46fc54c46aadabce55bd88c99bacab3eeab309517d72acfbe6f2273c6c3177e6	1763705946655
2	a6569685a03885918414f12a52e7b6c75ca10515960ff34d53ee2fdc53aa30c4	1763764961930
3	1555c0f90641def57895875b64afab73a7d998c1b95f96e7e0b43629d3d607ff	1763765158819
4	585f256fe04b70309d189fdad5bb2e8ea6b76a2238bde9c09c1f8ec8cd03a5d9	1763774510445
5	dd32a842bd3e7215b1269f95cdd46c382a61c5e7e01a0c46df6e985d3cdb6a3f	1763774730878
6	2d1da3d3172312a584424c7f85776302aa5358a2cb3f7e57885379606b3791d0	1763774799803
7	ad3e7afff9132bc9c915f6c3ad10d49c272926d1040650aea9483c731da812cd	1763866522987
8	646f574ed5c4b250dc7bf00e637bbb717c1d6d380b10c7171fddcb927ec8e4ce	1763953616509
9	d0a7a3be7e8f01107cabb64137fed314cc53f4270bbecf8ba6b83762e683e468	1764839953131
10	2a3a84bf328ea5488d6b6ad00c0e2261938561e978acb6e69887d47185baa99d	1765935293474
11	211581f5fa9d7db2789a425ea6da66079165cfd52b3a9172f22b08e329173994	1766104158926
12	9437c696a9675660b32994ac4b245e3561b1b896db016136f2f86039e8e747d1	1766306912379
13	bca5e102b45641f947249ea7ef2b419163afc2c02e23e9bc176f5e33b81c14df	1766825990366
14	6a53a4bbe785e1483d0a64ed135c1b09c96537cf33600af6b453a2cee970ac13	1766826007470
15	c9157914083a010f54eab90324abf70a7ec3f63e134be14b3c77a928885f7b78	1767183138087
16	e08dc8c293d7fe4113707dc26da6010950d6d4f02284249c4f77463db8897535	1767357201976
17	4d1d2cbb346770b51b7c7f9aef390c11ceedeb9319e9b77906ff5e3b8c8530ae	1767499180347
18	c2aea2c607b7fe8eb1ece0d44b0b4de60bf2e68181f5d44f4c7d0395eee9f089	1767499270884
19	8af83687798842d26776bd1834eba350b0185d83e6792e1fef91f316924a38f8	1767594782263
20	dc6a3cc6846a06c32f2f7fea20a59e83d113214a39a51d9716103f7e0ab2a2b1	1767594858995
21	f9e477bab79940698cf72bf83adcf78da0782a450a21c5009a1261d811d455dc	1767594917933
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
35af19b8-23c9-4ac2-bbc4-ef8c5772e345	6ebdb445bc0121852736f59b9daf67a57923203a9ad8758719cc57e04b2f46e7	2025-12-28 14:25:51.144841+00	0_init		\N	2025-12-28 14:25:51.144841+00	0
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, access_token_expires_at, refresh_token_expires_at, scope, password, created_at, updated_at) FROM stdin;
YSIUWOHpekYvzMmvHpSpza8Wp0n06iIa	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf	credential	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf	\N	\N	\N	\N	\N	\N	8ee2be656d6fba41b908f4fb56e2dd83:7761656b3757ee96571d00c157952933147ea5bf9c736a999985227a1ab48e76978c2c248d33f782a31fe5f4e4758446de88bc3cdfe162d1e04a68cf0ed1503f	2025-11-21 09:13:17.586	2025-11-21 09:13:17.586
\.


--
-- Data for Name: reconciliations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reconciliations (id, transaction_id, amount, is_gst, reconciliation_group, budget_category, project_id, created_at, updated_at, description, project_stream, project_item_id, loan_id, is_payoff, loan_payoff_id) FROM stdin;
161fac6f-b40b-4460-be26-ccff0ac076e6	fc6b569c-d662-49b7-9366-da6d2de45928	120000	f	project	\N	35e96736-2752-4b0d-a07e-c25dc5b3c572	2026-01-02 12:34:58.117655	2026-01-02 12:34:58.117655	Bifold window	payments	9a287591-d106-49fb-b000-537c756abfd9	\N	\N	\N
41530e4e-01fe-4152-8e51-752a77db2da5	c8a1748d-f3a5-4916-b35c-0e81d2429b70	210000	f	project	\N	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	2026-01-02 12:34:58.143463	2026-01-02 12:34:58.143463	Remove, supply, and intall doors and windows	payments	02f72e69-4a71-4774-9295-89fbe1e10541	\N	\N	\N
bce1d6dc-7f6c-4f87-8eae-be8129ede39d	05aea2d6-4fa3-4121-92cf-b78beeacf4f6	50000	f	project	\N	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	2026-01-02 12:34:58.151469	2026-01-02 12:34:58.151469	Retractable flyscreen	payments	1376dfd5-9cf4-4670-8b3c-94f8a600a0a6	\N	\N	\N
fcaf7d6d-3099-461e-ae65-192eeda9d050	c4e8a935-8e17-4196-b999-3716574cd2a5	150000	f	budget	salary	\N	2026-01-02 12:34:58.168224	2026-01-02 12:34:58.168224	salary	\N	\N	\N	\N	\N
3b2c0763-5991-4246-aa96-14a042078e0c	72d8d7e1-6d8b-44cc-a048-3012d2ad650d	9000	f	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:58.174645	2026-01-02 12:34:58.174645	angles	supplies	e7cbba32-4882-4b24-b976-3ba86622d690	\N	\N	\N
2f013d23-5607-42de-b5c6-236ad474d43d	bad5cfe3-e06f-42f2-82d0-2ad0f0b3a28a	90000	f	budget	tool	\N	2026-01-02 12:34:58.180116	2026-01-02 12:34:58.180116	a frame	\N	\N	\N	\N	\N
9334ff0b-dd34-4cd5-9136-9de27d2697b5	81c19fc1-8deb-4c9f-9304-2ba66037843c	50000	f	project	\N	a7edf71d-c062-4f95-9e3c-d8bc8c532983	2026-01-02 12:34:58.186318	2026-01-02 12:34:58.186318	project payment	payments	87945306-d723-4b61-a856-641720c9e987	\N	\N	\N
17df92d2-1c1c-4cb0-b80e-3887f50ae72d	c65cb7ab-f11e-493a-a404-7f09dc3f1b36	150000	f	budget	salary	\N	2026-01-02 12:34:58.206631	2026-01-02 12:34:58.206631	salary	\N	\N	\N	\N	\N
6018268d-8bb9-4d12-8cb3-33b6b41b981d	1d98aa49-70be-40a5-9b7d-c998b38f4e29	275000	f	project	\N	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	2026-01-02 12:34:58.214576	2026-01-02 12:34:58.214576	retractable flyscreen	payments	f894b67f-2411-4f14-a678-06feb96dfa5d	\N	\N	\N
47a381fd-7a30-48d7-9ead-45791c08b311	eaa24be2-5371-4ade-b5aa-1fe604615c61	250000	f	project	\N	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	2026-01-02 12:34:58.221754	2026-01-02 12:34:58.221754	project payment	payments	08c0b13b-0ac0-42cc-b4cd-329b09aac812	\N	\N	\N
8104bfca-5c07-4ad1-a128-d7fee3402928	c873e563-4700-49e7-8894-db0e00f94d71	100000	f	project	\N	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	2026-01-02 12:34:58.233197	2026-01-02 12:34:58.233197	cover sheets	payments	273981ce-e7e1-4fa7-9bbb-08fd0b0fa874	\N	\N	\N
24a5fec6-cb61-4665-a39f-124af42f1ca8	81e4a142-64b3-4df3-aaa7-c5c021b3878b	25000	f	project	\N	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	2026-01-02 12:34:58.242879	2026-01-02 12:34:58.242879	door jamb	payments	9572e575-5b91-4009-bf31-8289e94f3138	\N	\N	\N
b37c5408-c197-48b0-aee6-8aa1b0a1b848	b2ff2767-eaca-4d13-b7af-253ab451dd76	100000	f	project	\N	39f350e5-58fd-402e-955b-612f29624236	2026-01-02 12:34:58.250031	2026-01-02 12:34:58.250031	project payment	payments	dcc1d756-e43d-4dd1-b19a-256d1478b138	\N	\N	\N
67d8f5de-2838-46d4-a3cc-c3e0de4a539e	6ff7a060-8f60-4981-b56e-a96c3edc7556	20000	f	project	\N	a7edf71d-c062-4f95-9e3c-d8bc8c532983	2026-01-02 12:34:58.261609	2026-01-02 12:34:58.261609	project labor	labors	d740dc16-5a7c-4367-8c51-9c2048239079	\N	\N	\N
f928f795-85cc-4332-8b2c-b0b8cb9313a3	6ff7a060-8f60-4981-b56e-a96c3edc7556	30000	f	project	\N	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	2026-01-02 12:34:58.265907	2026-01-02 12:34:58.265907	project labor	labors	418a9779-af4f-42d6-a974-f65f377cadb0	\N	\N	\N
13b633d6-5e22-4b0b-b38d-29dc57256fdd	8f08813f-66e3-43aa-a354-4631177e0854	85000	f	project	\N	a7edf71d-c062-4f95-9e3c-d8bc8c532983	2026-01-02 12:34:58.272761	2026-01-02 12:34:58.272761	project payment	payments	f63021ea-2803-4a86-98a5-41f0be9ef681	\N	\N	\N
6f730950-2faa-4db5-aeff-7b1cd114049d	53d748c6-3658-49a3-b6c6-1bb72218c475	20000	f	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:34:58.279437	2026-01-02 12:34:58.279437	project labor	labors	42d2b00a-ffff-4f45-851f-7a68474936f9	\N	\N	\N
234adbae-0429-41e7-a079-2e2413ad608e	53d748c6-3658-49a3-b6c6-1bb72218c475	20000	f	project	\N	b6320ca9-8b3a-4451-8118-1b6b0544f986	2026-01-02 12:34:58.283144	2026-01-02 12:34:58.283144	project labor	labors	3fc9be1d-31b3-4990-9229-d9e6d3bc2567	\N	\N	\N
fb2ef097-1d84-46ab-b6bd-90c215fe9061	53d748c6-3658-49a3-b6c6-1bb72218c475	20000	f	project	\N	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	2026-01-02 12:34:58.287146	2026-01-02 12:34:58.287146	project labor	labors	2f85bf7a-3fad-4289-995d-f460ca595887	\N	\N	\N
42094a05-47ec-4aa1-bc1f-ef6996a0c220	53d748c6-3658-49a3-b6c6-1bb72218c475	10000	f	project	\N	d23c367d-7648-4f2e-bb88-775552ead5a9	2026-01-02 12:34:58.292847	2026-01-02 12:34:58.292847	project labor	labors	796a766f-38ac-4081-9227-12bf0d1c1c0f	\N	\N	\N
b4c2bdc1-f15f-4435-8030-eec0d7b66121	2f24bde5-4d30-479b-964a-d11873c4bd9d	160000	f	budget	salary	\N	2026-01-02 12:34:58.297692	2026-01-02 12:34:58.297692	salary	\N	\N	\N	\N	\N
c4f2d02a-e306-4da4-9b71-42611920e582	a61bf730-95b3-42bc-94da-ad5325488c58	70000	f	project	\N	39f350e5-58fd-402e-955b-612f29624236	2026-01-02 12:34:58.302678	2026-01-02 12:34:58.302678	kim project	payments	256f14b9-98a4-478e-b287-41e7455c93dc	\N	\N	\N
48e4e25d-d5f5-4044-b559-22cfcd819f6e	ed18ea26-7239-4fc4-90a0-3074150954f2	25000	f	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:34:58.309591	2026-01-02 12:34:58.309591	ahmed labor	labors	371445cb-67de-4890-969c-09b9fbf96210	\N	\N	\N
3648a29d-a5c2-40b6-a225-4b1ba8d09184	ed18ea26-7239-4fc4-90a0-3074150954f2	20000	f	project	\N	39f350e5-58fd-402e-955b-612f29624236	2026-01-02 12:34:58.314135	2026-01-02 12:34:58.314135	ahmed labor	labors	f29355b1-ba49-4cf4-aecf-d73abcc42ede	\N	\N	\N
2082bec0-0066-4255-af29-06e65e6e54b4	ed18ea26-7239-4fc4-90a0-3074150954f2	15000	f	project	\N	92b06e18-1882-4d30-8338-5ef8ed47ee8d	2026-01-02 12:34:58.31906	2026-01-02 12:34:58.31906	ahmed labor	labors	9e49a944-7886-4057-8a24-5efc1f681d28	\N	\N	\N
b15886c7-189c-46a2-bf80-b8c12c583db4	046e97c3-bda3-4922-9964-32efdc97a002	80000	f	budget	salary	\N	2026-01-02 12:34:58.323202	2026-01-02 12:34:58.323202	salary	\N	\N	\N	\N	\N
12b569bc-1cd5-4ced-bc32-f07037b1bee1	a941efcf-0e69-4ca5-b314-376b70901024	95000	f	budget	tool	\N	2026-01-02 12:34:58.328439	2026-01-02 12:34:58.328439	laptop	\N	\N	\N	\N	\N
b4e545cd-71e0-4d55-b58f-59fe58dd7a6a	e3a0181b-0ec8-4b3a-a868-62ec031d23c2	25000	f	project	\N	4e96cf11-e67e-42d4-8096-c604e7b041be	2026-01-02 12:34:58.332726	2026-01-02 12:34:58.332726	ahmed labor	labors	2a014e8d-ed02-41e8-a1d2-061c38391176	\N	\N	\N
cb8ed1e7-cdfe-4b12-bc41-5a518ec9b42b	e3a0181b-0ec8-4b3a-a868-62ec031d23c2	25000	f	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:34:58.337979	2026-01-02 12:34:58.337979	ahmed labor	labors	5fa2c097-f424-445b-8b7b-6ab6bd1fb909	\N	\N	\N
ed5d7da6-f4e8-4ec0-9de3-09f5f6a5646c	6b724aba-6480-41de-a625-23d9d587c678	5350	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:34:58.345179	2026-01-02 12:34:58.345179	packers	supplies	479b12f5-b7a2-4eb9-bc4f-9725a7f555e3	\N	\N	\N
b8e11d0e-f4c5-4706-9912-a2486e64b73a	95b00a6c-7314-4fc8-813c-56d759528147	135000	f	project	\N	f249b0de-1fa6-4027-baa2-89f04b0f24ca	2026-01-02 12:34:58.362639	2026-01-02 12:34:58.362639	claudia project payment	payments	d308ee8b-0082-41a0-85e5-2d2b9a9bc092	\N	\N	\N
849803f4-bbb4-4660-86a3-649cf1317f1f	4bd1431e-5a4b-489d-b347-73ef58266a4a	25000	f	project	\N	f249b0de-1fa6-4027-baa2-89f04b0f24ca	2026-01-02 12:34:58.368087	2026-01-02 12:34:58.368087	ahmed labor	labors	2b819a00-3021-4cbb-8d2b-d9f79fe08612	\N	\N	\N
f06a7dac-d7ad-4057-ac38-213a6a0f2156	4bd1431e-5a4b-489d-b347-73ef58266a4a	25000	f	project	\N	76a4a8c5-3e73-47b9-9416-030909165ed7	2026-01-02 12:34:58.372071	2026-01-02 12:34:58.372071	ahmed labor	labors	b00fd586-4a62-42c5-bf6f-2758df0d3d00	\N	\N	\N
5f6362aa-165b-48fb-8427-a6c87d8a3666	4bd1431e-5a4b-489d-b347-73ef58266a4a	25000	f	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:34:58.376585	2026-01-02 12:34:58.376585	ahmed labor	labors	0474f716-ac5c-4a5a-bddd-53bd35145cf8	\N	\N	\N
170d73b5-45b9-45da-bcaa-28f936120b47	512d6d54-14e3-4526-8160-1197e57f55fe	20000	f	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:34:58.383877	2026-01-02 12:34:58.383877	ziad labor	labors	60a15df0-0cef-4cde-991e-5583bc01257b	\N	\N	\N
04f27eea-a257-4c16-9d98-04e02b7556cb	20a4726e-a8ad-42da-b361-16964510a93b	40000	f	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:34:58.388646	2026-01-02 12:34:58.388646	ahmed labor	labors	ad9fb194-6149-43b6-b7ce-1185973ed940	\N	\N	\N
ee043dc3-6fd2-403b-890f-a61cbdee8497	20a4726e-a8ad-42da-b361-16964510a93b	40000	f	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:34:58.393251	2026-01-02 12:34:58.393251	ahmed labor	labors	4d855221-40ff-4d06-a12e-48f3c49bf6bf	\N	\N	\N
fc2898c0-fd6f-4193-a681-baa0dce57893	35661ca4-926c-4aa1-9175-21409bbdd973	95000	f	budget	salary	\N	2026-01-02 12:34:58.399243	2026-01-02 12:34:58.399243	ahmed salary	\N	\N	\N	\N	\N
dfd4b78a-03ef-445c-8a25-bba531f3c33a	fa39fa6a-4e5c-4c7f-9faa-89f321d7686f	20000	f	budget	salary	\N	2026-01-02 12:34:58.402503	2026-01-02 12:34:58.402503	withdrawal-osko payment 1328609 a al-matari cash account	\N	\N	\N	\N	\N
d89d7cbe-592f-4b66-9cc5-9c1a33bd925d	5e83e29d-59a3-472c-9e40-26f6fa6c5069	50000	f	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:34:58.406841	2026-01-02 12:34:58.406841	christine project	misc	40d4146f-76d9-43fd-b67e-3d6eb965a53c	\N	\N	\N
24f17adf-9ae2-462f-a1f7-7839e9fd9323	78dd5aa5-809f-49b3-8c97-e2e53242273c	300000	f	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:34:58.414501	2026-01-02 12:34:58.414501	christine project	payments	1c342784-7292-4322-8f3c-41c08893a750	\N	\N	\N
fee765d7-04a1-4dc0-bd70-7a709f67ad13	b40c631d-594c-4ae8-a726-9c3b995d2907	66000	f	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:34:58.42178	2026-01-02 12:34:58.42178	christine project	payments	809a1bde-faa2-4ae9-abe1-66b037bc273c	\N	\N	\N
3aa8111f-3ec5-42fd-a350-4852244ff980	a2678623-93ab-48fa-931a-30e1b955dd13	10000	f	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-02 12:34:58.427018	2026-01-02 12:34:58.427018	ahmed labor	labors	8a2be798-14ee-4d18-b04a-4dc60d423f23	\N	\N	\N
0ca22e11-36e3-436a-aad0-cba3f664ac3a	a2678623-93ab-48fa-931a-30e1b955dd13	10000	f	project	\N	005c1242-89c9-4d64-b11d-5d983b4735a8	2026-01-02 12:34:58.430288	2026-01-02 12:34:58.430288	ahmed labor	labors	b28c5540-7bb7-4127-8d91-547f3a48b064	\N	\N	\N
b2b05dfd-bbda-4617-9e43-980c148e908e	a2678623-93ab-48fa-931a-30e1b955dd13	30000	f	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:34:58.436559	2026-01-02 12:34:58.436559	ahmed labor	labors	28ce788e-d2b4-4f28-9af0-f3c6ccaaaa4f	\N	\N	\N
27323200-a762-4af8-ad35-c6575ff19262	a8d0f69d-0991-413a-b00e-145b8166c8be	299	f	unclassified	\N	\N	2026-01-02 12:34:58.446233	2026-01-02 12:34:58.446233	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
400890e5-083f-44db-9cdb-13187548d94b	c9eb7274-752a-4737-a2cb-ac8fbaf87739	6616	t	budget	subscription	\N	2026-01-02 12:34:58.4512	2026-01-02 12:34:58.4512	debit card purchase ezi*biz cover (No.3) sydney aus	\N	\N	\N	\N	\N
9b96f921-4682-4942-aa83-656587f67986	b85bc4bf-8c8a-4431-bd19-c640e834f8c0	2007	t	budget	toll	\N	2026-01-02 12:34:58.454138	2026-01-02 12:34:58.454138	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
dda23611-eb5c-41e8-97a4-c79e60ada5db	59f844bb-10ba-465c-bd30-9d5e1dc036b3	1116	t	budget	tool	\N	2026-01-02 12:34:58.456776	2026-01-02 12:34:58.456776	debit card purchase bunnings 501000 rose bay aus	\N	\N	\N	\N	\N
3721205e-ab7e-4695-9b56-fed06fa07bad	ae91b417-f1fa-48a3-ba3f-9e1579ea4dba	40000	f	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:58.16293	2026-01-02 12:34:58.16293	Labour	labors	f8065a53-2924-4216-b56f-ad8937c04d16	\N	f	\N
4d653d4b-8963-403c-8572-a23e122e5a7a	dcf79942-2009-41d5-af27-eb7f893d8c38	655	t	project	\N	b999eb78-03af-4adc-84d6-1e0142d8d57a	2026-01-02 12:34:58.463378	2026-01-02 12:34:58.463378	debit card purchase woolworths 1323 blcktown aus	misc	849da112-f1d5-4a08-8de2-1ae145948f4c	\N	\N	\N
3aea4328-86cb-49e7-b1a8-c2214a5b6ce4	e3bc2e94-a069-4d0c-8cff-c178703c6d04	30000	f	budget	consumable	\N	2026-01-02 12:34:58.468347	2026-01-02 12:34:58.468347	withdrawal at handygank auburn 2 23225166	\N	\N	\N	\N	\N
58f6c196-dc2c-469f-90db-c7b462f3b3d9	6089e72e-875a-4485-b29c-316c564e8253	2007	t	budget	toll	\N	2026-01-02 12:34:58.504663	2026-01-02 12:34:58.504663	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
9a83de5d-b7e6-4121-9551-ad965fa25f43	85bfd85e-4723-4eda-bf98-9dc62c7a07be	41075	f	unclassified	\N	\N	2026-01-02 12:34:58.527244	2026-01-02 12:34:58.527244	debit card purchase costco wholesale pty lidcombe aus	\N	\N	\N	\N	\N
f14f6ebf-f853-4d51-a47d-54f0ec19483c	df7ea8b9-dd98-46ff-9156-3d390469b65e	2007	t	budget	toll	\N	2026-01-02 12:34:58.563636	2026-01-02 12:34:58.563636	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
1e3e780b-554d-4845-b9af-ad426f7ea4ad	9b53ef30-8d3d-4565-ba00-a8a1cd6d86ed	2007	t	budget	toll	\N	2026-01-02 12:34:58.567226	2026-01-02 12:34:58.567226	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
e02573cd-319e-4959-b762-da4e591ffec1	3ee8fd12-cdc1-4c12-ac4c-f3dbbac333ca	900	t	project	\N	49cd8378-4481-4c2d-9e9e-268241211306	2026-01-02 12:34:58.581016	2026-01-02 12:34:58.581016	debit card purchase ampol rosebery 22364f rosebery aus	misc	763502e6-eef9-4b78-9e64-1a44caafa425	\N	\N	\N
291ba30c-ea31-408e-b631-8e7bbe3ca4ac	dd825e13-f9d9-4e9f-9fbe-9dddf06760d6	8033	t	budget	tool	\N	2026-01-02 12:34:58.600114	2026-01-02 12:34:58.600114	debit card purchase aluminium specialtie eastern cree aus	\N	\N	\N	\N	\N
8d8a0e6b-16e7-4110-a185-20adb9559e45	7b7404fb-8f95-469f-ac38-a41d31535d74	1699	f	unclassified	\N	\N	2026-01-02 12:34:58.610481	2026-01-02 12:34:58.610481	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
c2bb70eb-8123-4d66-ad68-d6e57c4cbeca	da3c372b-63c0-4182-a451-ee02028383e2	50000	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.617423	2026-01-02 12:34:58.617423	deposit-osko payment 29616744 aaa bayside homes pty ltd	payments	27a9b23f-6438-4723-a21e-45e467e0d597	\N	\N	\N
7a2e9f5f-b780-422f-998f-f368771b55f8	fad280d1-ad6e-4bbf-9869-26c37fb0cd8f	2007	t	budget	toll	\N	2026-01-02 12:34:58.622576	2026-01-02 12:34:58.622576	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
be445cf2-7838-45c1-9f9e-faf0f0f77ec1	f28b8a0d-7c9f-4f83-bd2a-76db1f088d11	2007	f	budget	toll	\N	2026-01-02 12:34:58.635048	2026-01-02 12:34:58.635048	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
d45244c3-1fb2-44c6-8e9e-96635b180bb4	fde97357-114b-4072-a87a-45bd25e5cb88	449	f	unclassified	\N	\N	2026-01-02 12:34:58.63818	2026-01-02 12:34:58.63818	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
824a750a-f61d-4bde-b933-0cbe7cf68c26	66f9951c-dcff-4918-9057-1f53983337a1	3231	t	refund	\N	\N	2026-01-02 12:34:58.641153	2026-01-02 12:34:58.641153	Debit card refund bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
d642afe2-e5e0-4b57-91cc-784674b6a9b6	b596d792-8b97-441e-9bcf-8385dc60912d	350	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:58.647235	2026-01-02 12:34:58.647235	debit card purchase ampol croydon 22430f croydon aus	misc	1d81140b-bebe-42fd-a736-c03b06922aaa	\N	\N	\N
cd9818fe-ccca-4a1b-8de3-363bbc1cc564	70ec7839-4482-44fa-947a-439ec68f3f86	1599	f	unclassified	\N	\N	2026-01-02 12:34:58.651788	2026-01-02 12:34:58.651788	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
a4e80eb7-7b4b-4d97-9cc7-9424400c739a	37184d11-ae5f-4207-900f-e300207018a3	2007	t	budget	toll	\N	2026-01-02 12:34:58.67072	2026-01-02 12:34:58.67072	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
897d433a-8afe-46ba-85a3-3ef6a32fbd00	fdb11936-2c36-492b-9bd9-00ffcee1f106	3231	t	refunded	\N	\N	2026-01-02 12:34:58.673661	2026-01-02 12:34:58.673661	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
4337f137-4ae9-4499-909b-ed0030711eaf	635d4bc3-bef9-4d72-aade-921728f77463	20000	f	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.693957	2026-01-02 12:34:58.693957	withdrawal-osko payment 1739756 abdulhabeeb	labors	4f29a4c6-b0ea-492c-8ee0-a7c5a9f11b3d	\N	\N	\N
85111c4b-393f-4aa1-841f-2084eff1f986	9c0e6ca0-b024-4a94-8c09-8164ad4b6cd0	300	t	budget	consumable	\N	2026-01-02 12:34:58.698083	2026-01-02 12:34:58.698083	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
7e6bf326-03db-4989-9291-4f3346110e69	6da4ef65-dea2-4869-90e7-468dd5a3c472	778580	f	tax	\N	\N	2026-01-02 12:34:58.702936	2026-01-02 12:34:58.702936	tax refund	\N	\N	\N	\N	\N
dff9e8d7-f53e-4311-bffa-63bbb2c3ce21	d5f7cf76-6759-4ef8-bdb1-194228f09b4a	308000	t	budget	consumable	\N	2026-01-02 12:34:58.706645	2026-01-02 12:34:58.706645	certificate 3 glass and glazing rbl	\N	\N	\N	\N	\N
e9f0d6dd-671e-4fef-bf0c-4e49935d6989	f3757483-2d53-41a0-a721-19b0ce76ca6e	17800	t	refund	\N	\N	2026-01-02 12:34:58.723288	2026-01-02 12:34:58.723288	debit card refund bunnings 593000 lidcombe aus	\N	\N	\N	\N	\N
3a415bc5-867a-4048-a23e-ffcbc74ad536	540e6940-4d4d-4e3f-975d-787efb758b6e	38800	t	refund	\N	\N	2026-01-02 12:34:58.726954	2026-01-02 12:34:58.726954	debit card refund bunnings 593000 lidcombe aus	\N	\N	\N	\N	\N
c6808244-174c-4837-a049-d881a03e4acc	0187cec6-a334-47ea-8228-41ea00fba962	166250	t	budget	tool	\N	2026-01-02 12:34:58.730194	2026-01-02 12:34:58.730194	debit card purchase bunnings 593000 lidcombe aus	\N	\N	\N	\N	\N
f4696924-a670-451c-b976-9d278e0a7cef	801c0b25-30fd-41fe-a109-ab49bf50a22d	82950	t	project	\N	c54b137c-8ed7-425c-a408-80272ba1c953	2026-01-02 12:34:58.718644	2026-01-02 12:34:58.718644	deposit 296252 mark mc lean 13 johnson st mascot 13 johnson st mascot	payments	d97784d4-be48-4133-88f8-4453e2a0fa13	\N	f	\N
fc067429-fb0a-4b33-b1da-db28fc487872	237a34e4-f4a7-4777-9a28-7e75f8295f52	100000	t	project	\N	c54b137c-8ed7-425c-a408-80272ba1c953	2026-01-02 12:34:58.595772	2026-01-02 12:34:58.595772	withdrawal at handygank auburn 1 23224009	supplies	befb2d37-d58a-4ac5-9dad-50e4e4d54472	\N	f	\N
47018676-a254-4016-a006-fee863fad4ef	6d7162b3-115c-4b6d-abc6-290f00c074a1	6000	t	project	\N	c54b137c-8ed7-425c-a408-80272ba1c953	2026-01-02 12:34:58.688486	2026-01-02 12:34:58.688486	withdrawal-osko payment 145158 mr top group pty ltd	supplies	ae575b83-3263-44c2-b71e-a9cdadd99c91	\N	f	\N
9bccc437-ab02-4ffd-a993-dd6d0fefad07	331f34e7-450d-47d2-b2c8-4a6bc1688187	200	t	project	\N	c54b137c-8ed7-425c-a408-80272ba1c953	2026-01-02 12:34:58.605982	2026-01-02 12:34:58.605982	eftpos debit 0343610 bp mascot 2266 \\ mascot	supplies	2da2e78b-3207-4258-b3d4-534af57d1261	\N	f	\N
49a08657-40cb-4b7e-8a23-e7dd96b016c2	8ecf186c-6b98-4b28-8498-ae106cccaf6d	1550	t	refunded	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.483961	2026-01-02 12:34:58.483961	eftpos debit 0186322 shell reddy express papagewood	misc	7a79c50b-7825-444d-9658-4ca18f84f589	\N	\N	\N
86f3702f-150c-4dea-b4d3-661ce42d2e43	cc3f9f0f-1106-4d9a-b4b9-623d66526bba	13875	t	project	\N	b999eb78-03af-4adc-84d6-1e0142d8d57a	2026-01-02 12:34:58.533063	2026-01-02 12:34:58.533063	debit card purchase ampol homebush homebush aus	supplies	c42cb540-b968-4c74-9e3d-b6f2d613b6f8	\N	f	\N
e5f5dc4f-dae0-467f-aaf8-aaa2e201a6ef	81785d6a-5014-4652-a154-e49727b0d8a9	10000	f	project	\N	b999eb78-03af-4adc-84d6-1e0142d8d57a	2026-01-02 12:34:58.521132	2026-01-02 12:34:58.521132	withdrawal-osko payment 1767554 marlon jayona	supplies	ec1d43af-528d-46cf-9f62-2db9e4ae54b6	\N	f	\N
e0bb16ea-e133-411c-908c-9e0f96cd9eb7	f0388654-08f2-4ea4-b68c-d2396b2c4066	6000	t	project	\N	b999eb78-03af-4adc-84d6-1e0142d8d57a	2026-01-02 12:34:58.73586	2026-01-02 12:34:58.73586	withdrawal-osko payment 1019345 marlon jayona	supplies	f9759c0f-c429-48b4-bf7d-bf448f8df687	\N	f	\N
fe9ba64f-6829-4bf1-8eaf-9964fead2241	a6eb188b-fc44-4687-af64-a78bbdd12d83	1550	t	refund	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.512525	2026-01-02 12:34:58.512525	eftpos credit 0186322 shell reddy express papagewood n	misc	57749387-497e-4e8c-be11-5a619ad54000	\N	\N	\N
6c3350e1-b8ab-4a9b-a056-a66891d8b02b	a05ded9f-b7f1-4f41-80f1-f3405fcedf56	1550	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.476314	2026-01-02 12:34:58.476314	eftpos debit 0186335 shell reddy express papagewood	supplies	852381d8-3b18-4992-8221-85d9e9add1b0	\N	f	\N
9fd66205-41cc-41ce-b62e-a7030ef7fd26	b0769a83-1c9d-4bb8-b02b-30614cbf0e90	1000	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.492757	2026-01-02 12:34:58.492757	eftpos debit 0186321 shell reddy express papagewood	supplies	7868493a-65dd-4390-b534-7a1553bdba05	\N	f	\N
05921566-79cc-4683-9e14-6ba7050e5145	88cd42c0-d0c6-4d27-9a6e-5a42e78ccaee	911	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.500155	2026-01-02 12:34:58.500155	eftpos debit 0040431 q *nowness espresso bmaroubra	supplies	315ed19e-cc88-4eac-9184-1337886a3125	\N	f	\N
a52b52cd-1aa7-4a28-bd32-741a7669f812	85a33cd0-0a42-473b-b246-364c632913f0	3020	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.540152	2026-01-02 12:34:58.540152	debit card purchase mahi capital pty ltd randwick aus	supplies	859b5e73-c7a5-45b1-84be-b9c70da23392	\N	f	\N
559f62ae-5a97-4ac8-a092-0131e0fbb833	718a84af-0f67-4f76-b249-e717f5387f83	2194	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.5494	2026-01-02 12:34:58.5494	debit card purchase bunnings group ltd hawthorn eas aus	supplies	f7d7621b-a785-4982-9e63-4f9906be18f1	\N	f	\N
2c98f25d-89c4-42e4-a094-0df2e8fb4e47	3aab3743-c873-4099-bcac-432dd3663a11	2166	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.558439	2026-01-02 12:34:58.558439	debit card purchase bunnings group ltd hawthorn eas aus	supplies	1e93c6be-6479-476a-9553-83e31c2083bd	\N	f	\N
eb5bf69e-4375-4964-bd0a-d06075d1ac92	a5177fa9-937d-46fe-848f-3ee4082954e8	10000	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.680368	2026-01-02 12:34:58.680368	debit card purchase costco auburn lidcombe	misc	081a87a0-abca-4541-89ac-0d8d33c77a8e	\N	f	\N
cdcafb88-a427-4ff6-afbe-bbdbbc778f23	5a6bba21-a9a5-4c28-9964-61e38bed40d2	1160	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:58.572606	2026-01-02 12:34:58.572606	debit card purchase point parking pty ltd randwick	supplies	f672a1d4-e0eb-46ec-9bcb-d5f69939a7d4	\N	f	\N
e08329df-0bc7-456c-901a-bbb1771d1a0a	d9bc0d80-3a30-4c2c-b961-30bf7627b093	1785	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.658127	2026-01-02 12:34:58.658127	debit card purchase bunnings group ltd hawthorn eas aus	supplies	e8bcb658-8c1b-4ad5-907f-da4c2cde26ca	\N	f	\N
41ad778a-6dac-4794-b4c5-9c87b706395b	2cbea24c-5f78-45af-a9ab-810d6da22fb2	1785	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.666071	2026-01-02 12:34:58.666071	debit card purchase bunnings group ltd hawthorn eas aus	supplies	c43c3e27-2443-48e3-9321-20c88f7f422b	\N	f	\N
b66ceed2-a3b2-4709-a5d8-8871997075af	a7fc4c11-8ddb-4a33-b9c3-44cf7462af57	50000	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.743432	2026-01-02 12:34:58.743432	deposit-osko payment 2045359 aaa bayside homes pty ltd	payments	b4a8e1a8-ae2b-471b-8c9e-790dc89d16d7	\N	f	\N
4ec673fb-b1e3-4a9e-9913-5850c182b127	c64ac9d4-f64f-4936-b2a6-6da81c6e7972	4900	t	refund	\N	\N	2026-01-02 12:34:58.74753	2026-01-02 12:34:58.74753	debit card refund bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
95b31099-9e93-4099-ac4d-259c4e2e094b	f3acaac1-15ad-426f-8083-8aa42ab64134	8900	t	refund	\N	\N	2026-01-02 12:34:58.751954	2026-01-02 12:34:58.751954	debit card refund bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
697be065-0909-4315-8819-59a7594c8830	fa4f7109-1a67-4856-bd23-fa842cfb2b5c	9900	t	refund	\N	\N	2026-01-02 12:34:58.7551	2026-01-02 12:34:58.7551	debit card refund bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
455a0b75-b863-49a8-b420-6e9e2ee61253	01649f5c-0ac7-4178-9cf7-7d417a2f09ab	36900	t	refund	\N	\N	2026-01-02 12:34:58.757994	2026-01-02 12:34:58.757994	debit card refund bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
64b3c013-8104-4842-957c-98302f26e89b	89ed7557-1760-4e14-a3d1-c57c7ba7f854	21339	t	budget	subscription	\N	2026-01-02 12:34:58.761263	2026-01-02 12:34:58.761263	debit card purchase budget direct toowong aus	\N	\N	\N	\N	\N
23966681-c564-4442-9709-d39b548ae9d0	6be70dd4-eeb3-48d6-baf3-600a4d9d31fe	43900	t	budget	subscription	\N	2026-01-02 12:34:58.764161	2026-01-02 12:34:58.764161	debit card purchase home improvement pages sydney aus	\N	\N	\N	\N	\N
ce2b725d-e8ba-4cc6-9a54-6a8a6e0a220c	d0c98061-78b7-4ea4-825e-07f4efaafb66	1360	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.799192	2026-01-02 12:34:58.799192	eftpos debit 0747113 ls the brew spot sydney	misc	4290797a-4280-43f7-8e92-d7ce5097b4ac	\N	\N	\N
f2261b66-ae33-4c1e-89e4-78aeb9130761	d892438f-e965-4912-a68d-e4fa942af7f7	350	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:58.81538	2026-01-02 12:34:58.81538	debit card purchase 7-eleven 2219 epping aus	misc	474a1f0c-0138-49f5-a489-b993c0bae2c2	\N	\N	\N
f2e7ce6b-401a-4015-a0c4-f0a2b7a4c900	f87560b4-5837-44d4-af9c-0381c3b0fb54	23827	t	budget	tool	\N	2026-01-02 12:34:58.819694	2026-01-02 12:34:58.819694	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
42d17d47-8474-4b0d-a580-c235962fdd27	b7a7781b-d330-4035-b2a7-09aa7765940e	20000	f	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.825842	2026-01-02 12:34:58.825842	withdrawal-osko payment 1978308 ziad abdulhabeeb	labors	7894c361-482f-4f66-abe5-91934da727f3	\N	\N	\N
0ba17b20-31ba-421a-888e-44e246e27135	040e5523-12d4-4d5e-9f90-ed73d83ad9ff	43	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.831168	2026-01-02 12:34:58.831168	debit card purchase costco auburn lidcombe	misc	0c85727e-dbb8-48f3-a4ff-2a1011961d17	\N	\N	\N
f6e81bce-1357-44e4-9439-13e7fd2d748d	0a0d5a82-138b-4721-bd15-f57605234353	587	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.836751	2026-01-02 12:34:58.836751	debit card purchase woolworths 1624 strathfield aus	misc	e68da24d-3c93-49fc-b505-da9e356afd02	\N	\N	\N
6baf94f7-5ce1-43f8-9e44-29b7b6e56962	8adda189-2255-47a5-a47f-53468c8acf6a	1235	t	budget	tool	\N	2026-01-02 12:34:58.841835	2026-01-02 12:34:58.841835	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
ca721268-ec17-4ceb-888f-254583758682	e21a9d10-65f6-4bd2-a046-4e76e2835a73	10000	t	project	\N	7b4689a1-e4cd-479a-bab9-802def112c4e	2026-01-02 12:34:58.846536	2026-01-02 12:34:58.846536	debit card purchase costco auburn lidcombe	misc	b8420065-4774-4b99-88c4-a8326325ee2b	\N	\N	\N
d494cfb8-cf77-4f46-a4fb-7c24db617deb	1cdbdbb3-7a51-4dde-9168-c4952d31bd89	21998	t	budget	tool	\N	2026-01-02 12:34:58.851146	2026-01-02 12:34:58.851146	debit card purchase costco wholesale pty lidcombe aus	\N	\N	\N	\N	\N
0dcb7443-33d8-4294-a72d-497f5fa695f1	f319a563-615b-4c4b-9ba5-c432b38cbe80	55000	t	budget	tool	\N	2026-01-02 12:34:58.854502	2026-01-02 12:34:58.854502	withdrawal-osko payment 1848631 y zhang	\N	\N	\N	\N	\N
7a0360ac-bfa6-493f-a488-4d5ea858eb9d	a07fdbfb-cda7-471d-847b-d78d4d6ff702	4200	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.873984	2026-01-02 12:34:58.873984	eftpos debit 0896774 el jannah burwood burwood 22/07	misc	482b4702-4ac1-405c-ae6f-d414d76be88c	\N	\N	\N
507671f3-b69c-4bb9-abd0-f0c7437de1d0	1a5e42e7-b9a2-4fdf-b2b1-a1793d9e4ad0	120000	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.888217	2026-01-02 12:34:58.888217	debposit-osko payment 2386704 aaa bayside homes pty ltd	payments	e06d66bd-dafd-4c04-9a11-767f59269142	\N	\N	\N
25d04d70-f5e4-4f3c-8351-6a204f81e3d2	b9b4ec1d-9324-4de7-8f92-dca48fdc3e76	400	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.893933	2026-01-02 12:34:58.893933	debit card purchase speedway south granv south granvi aus	misc	47bd7c9f-dd3d-4c5e-9c41-268bf3755e01	\N	\N	\N
1542b29c-123e-496e-a39f-c4cf0d4b3e88	6068cdca-c4e8-46a0-824d-c7de575fddb2	20000	f	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.899744	2026-01-02 12:34:58.899744	withdrawal-osko payment 1104599 ahmed hasan ahmedalhamded	labors	20f874ca-cbea-4196-8072-9b6f67cfe1bd	\N	\N	\N
495c73f2-0f05-4ed7-b811-5baccfce8e1b	bd76e666-183d-4d6d-bd1e-a64c1f33dcd7	275000	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:58.90433	2026-01-02 12:34:58.90433	withdrawal-osko payment 1535004 mr top group pty ltd nv-2008	supplies	754463dc-8e27-42a1-810f-89332863d7fb	\N	\N	\N
6ebd5cdc-15a0-48ab-b074-f7436e81e789	3b1db758-a8d5-4501-876e-9e87f80ff328	2999	t	budget	subscription	\N	2026-01-02 12:34:58.909057	2026-01-02 12:34:58.909057	eftpos debit 0161554 apple\\apple.com/bill \\mv2nl8h6l2a0 23/07	\N	\N	\N	\N	\N
689a5a01-e8d2-4934-b0ac-3b2ed0ddfb6d	84a96b2b-caa9-4394-bc5b-ef1a47874070	350	t	project	\N	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	2026-01-02 12:34:58.927074	2026-01-02 12:34:58.927074	debit card purchase eg group 1853 dural aus	misc	5b9a57e0-5a7e-4fbc-bda9-792baed42333	\N	\N	\N
6f7b2767-4d80-45cb-b746-e2f38f26f5b0	7c5ab889-5183-4b47-996f-2afbbf703043	70580	f	unclassified	\N	\N	2026-01-02 12:34:58.932823	2026-01-02 12:34:58.932823	personal charge	\N	\N	\N	\N	\N
4b2e3523-cc9d-400f-a48d-13fe54027565	8deff536-7972-40a4-8fa4-178f2b003582	350	t	project	\N	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	2026-01-02 12:34:58.94615	2026-01-02 12:34:58.94615	debit card purchase ampol pendle hi 22707f pendle hill aus	misc	847ad8f8-ab2f-4095-a7ba-500e5704e3f6	\N	\N	\N
85be5e37-9704-48d9-81ab-d86683e26ecc	3ebb3eb0-73cd-4aec-b784-e14cb22cfb89	10754	t	project	\N	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	2026-01-02 12:34:58.952125	2026-01-02 12:34:58.952125	debit card purchase costco auburn lidcombe	misc	d3aece44-5de7-413e-bc82-7bd95c7236d8	\N	\N	\N
2a048461-a331-4843-93e9-b6cc65639f32	dc1b96b4-b6b6-4c26-9023-f609b92d3fd5	12234	t	project	\N	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	2026-01-02 12:34:58.956329	2026-01-02 12:34:58.956329	debit card purchase yt aluminium australia milperra aus	supplies	056b5abc-ccf2-44f9-9c68-cfd5ac981531	\N	\N	\N
f7cc851b-931a-42e0-a9bb-646195b94707	3b78b770-d7cc-4099-8a57-ea2ee89ae91b	68210	t	budget	tool	\N	2026-01-02 12:34:58.961012	2026-01-02 12:34:58.961012	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
b62a49d6-6e83-40b2-b482-7ac47b260c53	e5637160-72ad-4541-9466-bbf07dbe04fc	406	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:58.971402	2026-01-02 12:34:58.971402	debit card purchase wilson parking syd179 blacktown aus	misc	96e96e77-c974-4961-85e4-7156a45398f2	\N	\N	\N
4b9c694c-4c10-40db-8683-7bb35cd00ee3	73eea676-6465-4b4c-add7-102524718e7e	6616	t	budget	subscription	\N	2026-01-02 12:34:58.975438	2026-01-02 12:34:58.975438	debit card purchase ezi*biz cover (No.3) sydney aus	\N	\N	\N	\N	\N
b8dade37-d81b-4048-bdc4-db5dc0fe3ebf	edf4e29c-7d7b-4dfb-880d-f58fc1adb0c4	7000	t	budget	consumable	\N	2026-01-02 12:34:58.979669	2026-01-02 12:34:58.979669	withdrawal-osko payment 1787808	\N	\N	\N	\N	\N
5e08754f-b8e0-4be0-ba89-53fb36d0a853	07e1f6cd-95ad-4ddc-a9b6-d379a7a16be6	2120	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:58.985149	2026-01-02 12:34:58.985149	debit card purchase oprto blacktown blacktown aus	misc	2caad5cf-c7f3-4445-8e4e-82ae9d048d82	\N	\N	\N
affe2e4b-b2b7-40af-9fe2-2ee814294001	f2098880-765c-4246-8d7c-226b40d8da7c	4200	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:58.990485	2026-01-02 12:34:58.990485	debit card purchase el jannah kogarah kogarah aus	misc	be01b359-1cfe-4a84-8178-856cbca566f0	\N	\N	\N
49c47a7f-f618-4e0e-a4ee-9e1c6ecc3d08	e2db7f95-105f-4de9-a27c-60ffbf9bc814	2007	t	budget	toll	\N	2026-01-02 12:34:58.996183	2026-01-02 12:34:58.996183	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
8f63b3f5-8f6e-4fcd-8014-e25b97f9d4bf	16d66604-482c-44dd-87b5-4d71284bb579	76890	t	budget	subscription	\N	2026-01-02 12:34:58.99929	2026-01-02 12:34:58.99929	debit card purchase home improvement pages sydney aus	\N	\N	\N	\N	\N
8e23504c-8ab4-4c23-b5cd-8304af0aab04	49ac9f22-4089-4a84-ab9a-13fa8b035820	390	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.771226	2026-01-02 12:34:58.771226	eftpos debit 0352461 el jannah burwood burwood	misc	751211bb-de27-42eb-abf0-4438619cffd9	\N	f	\N
137fa205-9def-4a3f-8bdd-527c26c98eb1	35498e07-d0b6-4ba2-a55d-60e3ea2cc0f2	1800	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.777847	2026-01-02 12:34:58.777847	eftpos debit 0361634 el jannah burwood burwood	misc	f021a9b5-07fb-43a4-a57e-429efa87b425	\N	f	\N
96fe53c4-e29e-4946-a32e-d1c5488ce131	2c89162a-a33a-4370-8958-ccdaa387d3cf	900	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.784122	2026-01-02 12:34:58.784122	eftpos debit 0367735 el jannah burwood burwood	misc	7f98d98f-74e0-47da-bd93-7c6046714ef5	\N	f	\N
5290587e-e1c7-4f0d-81d5-df5c0a1aa6f7	30746f00-30a9-4ec8-b2f8-e77a825a41ed	900	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.793556	2026-01-02 12:34:58.793556	eftpos debit 0456517 el jannah burwood burwood	misc	33b0830c-61b3-4f91-b89d-6cab3cb883b6	\N	f	\N
7b64c3ff-2703-485f-9c7a-f09fe150aaa5	d130fb18-2b6f-43d2-83df-125c6efb70d2	4267	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:58.881553	2026-01-02 12:34:58.881553	debit card purchase bunnings group ltd hawthorn eas aus	supplies	1fa6e47d-dc97-4b8c-933c-113ad495854c	\N	f	\N
58d2797f-8ded-4404-9049-48c0f4421bbd	619d345d-d159-4be0-8380-1b3f0548baa1	280500	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:58.807714	2026-01-02 12:34:58.807714	deposit-osko payment 2464506 crownview projects pty ltd t/as cro 133 deposit waitar	payments	0fe2ede7-4366-4f62-af2e-6cd8b4e48714	\N	f	\N
a10d08fb-e9a8-4847-9a77-8c9cc8d4357c	bc4e375a-4546-4505-919d-33b9fa06fb84	187000	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.00437	2026-01-02 12:34:59.00437	deposit-osko payment 2256319 crownview projects pty ltd t/as cro 133 final balance	payments	0918f79f-1ff6-46f5-9c15-e2559dcba0fb	\N	f	\N
851ce34a-8af1-46e5-bb06-e9f848cd3608	1c57dee6-ab05-4da6-869e-1a301058bc64	66000	t	project	\N	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	2026-01-02 12:34:58.937959	2026-01-02 12:34:58.937959	deposit-osko payment 2349187 n baillie baillie inv 134 final payment	payments	644d14f9-5dcd-4ea1-b2bc-82ef99323fcf	\N	f	\N
6f1f3386-1ac5-46d6-92d6-736eebda0892	8bc5a564-7ade-4cf1-98a6-c61f94f676eb	66000	t	project	\N	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	2026-01-02 12:34:58.921041	2026-01-02 12:34:58.921041	deposit 2230472 n baillie baillie inv 134 deposit	payments	644d14f9-5dcd-4ea1-b2bc-82ef99323fcf	\N	f	\N
5c01cc85-d88e-47ec-b458-f651aa3bc6ae	593f84a1-b09d-4dc3-9366-cb05e5482039	3998	t	refund	\N	\N	2026-01-02 12:34:59.00827	2026-01-02 12:34:59.00827	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
8f997573-3d90-48c8-be64-3db5f73c9407	80f1227d-b684-4c0d-8a58-52f975c9f615	379	t	budget	tool	\N	2026-01-02 12:34:59.012744	2026-01-02 12:34:59.012744	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
12a3a226-38a0-426b-8a37-425b280c8296	71072c88-0f7f-42d6-bb7b-ee81dfd98a26	898	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.017897	2026-01-02 12:34:59.017897	debit card purchase otr pennant hills east pennant hill aus	misc	0ef68285-954b-4b59-a44e-d244dabc2e3d	\N	\N	\N
4ee5fb62-dfe9-40c4-a7ac-57a1ab3c9801	bb91c135-1720-4232-a3b4-dae673637c05	1700	t	budget	consumable	\N	2026-01-02 12:34:59.022577	2026-01-02 12:34:59.022577	debit card purchase otr pennant hills east pennant hill aus	\N	\N	\N	\N	\N
4ea195c0-4c76-47d0-bad4-542b73cbd3b1	ddb75ebd-bc46-46db-92f9-d6df67c32cce	1858	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.027368	2026-01-02 12:34:59.027368	debit card purchase 7-eleven 2025 north rocks aus	misc	4948018c-c3ee-457d-bf9d-fb2c14808ddd	\N	\N	\N
8c6bfdff-fb0f-4d3e-9258-53d15aee0a02	4478a78d-05bb-4aac-a2e3-2a93a252452b	2007	t	budget	toll	\N	2026-01-02 12:34:59.033015	2026-01-02 12:34:59.033015	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
e3c257cb-dd5d-49a4-ae72-bf4666899720	5fc318c6-9e72-46d0-b01f-4a23d762d044	3150	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.037646	2026-01-02 12:34:59.037646	debit card purchase oporto hornsby aus	misc	8c65d178-4bdf-4ba1-a011-2d30a9f24f00	\N	\N	\N
84a2cd26-f45c-47ee-ac16-f212c1098d96	01828507-c889-497e-8907-55335f95889c	4086	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.04257	2026-01-02 12:34:59.04257	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	03ce3fa6-eb98-4f6b-80bc-eefde4665a6a	\N	\N	\N
de872db7-dbf4-4688-baa7-3c21fe4f8460	42ddba68-c1d2-4116-be43-cfafc9241c91	10584	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.04934	2026-01-02 12:34:59.04934	debit card purchase costco auburn lidcombe aus	misc	1092b9bf-838b-4716-86c2-6b333eb5a1c2	\N	\N	\N
49e633d3-ec46-43b2-8d47-cef613435391	be610d38-51fd-45a7-869e-9b0482c3506a	21403	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.054725	2026-01-02 12:34:59.054725	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	7daa4b87-266c-422d-aa43-87f43650f980	\N	\N	\N
1f03a732-650f-4dc8-bccb-6b084b9689ec	8ee62a45-fe5f-4c72-99da-9f12bd80525d	52155	t	budget	tool	\N	2026-01-02 12:34:59.058663	2026-01-02 12:34:59.058663	debit card purchase bunnings 573000 thornleigh aus	\N	\N	\N	\N	\N
e402e777-477e-4aa6-bc62-07f7fa6c86fe	dba6ff05-c95d-4b5e-95e4-9b1a8d566b52	20000	f	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.063557	2026-01-02 12:34:59.063557	withdrawal-osko payment 1624196 ahmed hasan ahmedAlhamded	labors	dd3386cd-84f9-450b-929d-3ebcdccfd76a	\N	\N	\N
9c8d3d54-9ddd-47a8-81df-4ef83122c8d4	1ceccdf5-4552-4d6d-86fc-aec1a0e3e057	632500	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.079939	2026-01-02 12:34:59.079939	deposit-osko payment 2371985 neeti gupta bi fold money	payments	3fa72c0a-04e7-464e-abd1-62b0b5f155b6	\N	\N	\N
245c2838-39cc-48c9-9c21-effc4629254a	f2d8bf79-20c2-410b-8f4d-ae0c345b6585	15473	t	budget	tool	\N	2026-01-02 12:34:59.084379	2026-01-02 12:34:59.084379	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
521bff24-2657-488c-8ba5-17840d4002be	09455933-eb9f-4443-a58f-b711fda3b846	300000	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.087899	2026-01-02 12:34:59.087899	withdrawal-osko payment 1037748 mr top group pty ltd	supplies	fa3b306d-d0a0-4e7e-a240-a9234eb43298	\N	\N	\N
f4ab5e74-d35e-49c9-ac4d-9efc1f16694b	ec64db78-8138-4892-8b70-105212dbcae3	44490	t	budget	tool	\N	2026-01-02 12:34:59.125046	2026-01-02 12:34:59.125046	eftpos debit 0255819 syd tools smithfield smithfield 07/08	\N	\N	\N	\N	\N
8eff7593-6125-4e04-bec6-4f0c5fad48d8	60c85108-e778-45f4-97bf-8dcdc3bbdd05	2150	t	project	\N	76a97d96-3b40-4c24-bfbe-e16362c59574	2026-01-02 12:34:59.130138	2026-01-02 12:34:59.130138	eftpos debit 0305941 el jannah smithfield 07/08	misc	2fa1f923-90c4-4275-92ac-eb3279751151	\N	\N	\N
03e8cb3b-fe40-4d7a-9ef7-cb11b2a4f26e	329424dd-1154-4ab5-9fec-031d9701fcdb	1699	f	unclassified	\N	\N	2026-01-02 12:34:59.134601	2026-01-02 12:34:59.134601	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
3d168ef1-cc05-47a4-abb2-50234c1cda79	6301ae88-883c-4fbe-830c-c7f14f9cfa12	2138	t	project	\N	76a97d96-3b40-4c24-bfbe-e16362c59574	2026-01-02 12:34:59.137698	2026-01-02 12:34:59.137698	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	2353bd55-b39f-4cfb-a344-b7282869860d	\N	\N	\N
dba570db-7075-4f11-9e06-87f3d298de22	23ba03d9-eddc-4fe0-a2be-c3d37b2359ee	12900	t	budget	tool	\N	2026-01-02 12:34:59.141556	2026-01-02 12:34:59.141556	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
8aa12946-0728-40cb-b2bf-d10ee5f39813	2cee1ce8-9d18-474a-ad5a-f2f3b0447551	517000	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.149521	2026-01-02 12:34:59.149521	withdrawal-osko payment 1360844 mr top pty ltd	supplies	3250d4e2-f99d-4bc7-ac5c-82a6b2f61ee5	\N	\N	\N
93ddaf50-41db-4a2f-917f-c68b3292dd93	ab58e384-f920-4ee2-9e24-6197ba9cebbc	250000	t	project	\N	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	2026-01-02 12:34:59.155406	2026-01-02 12:34:59.155406	withdrawal-osko payment 1452518 jonathan wu	misc	425ca8f9-c6b9-4eb5-b3ab-50340cd82066	\N	\N	\N
410944a7-4506-4d96-831b-a9da08f622b5	7c4889f8-a3cf-4590-b348-c17b3c94e3c2	4585	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.160921	2026-01-02 12:34:59.160921	eftpos debit 0501461 nandos_au_pinpads north ryde	misc	f978b63a-bf87-4ce3-b5de-88827428aac9	\N	\N	\N
e5540a18-fbfd-47c8-a62e-874153596815	1af99d3f-c0b9-4687-9a24-898c954e2f6c	8000	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.177081	2026-01-02 12:34:59.177081	debit card purchase costco auburn lidcombe aus	misc	bddffd58-57f0-44fa-9aa9-84545cb2fb57	\N	\N	\N
8d69e2fa-0699-4476-8d10-6f92b61707b5	b9b9c9b2-61cd-4189-a228-783a93b28ac4	15163	t	budget	tool	\N	2026-01-02 12:34:59.182736	2026-01-02 12:34:59.182736	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
de331aad-cf7a-45dc-9252-efed9c0d865d	5112d5fc-1474-4b12-bb84-eea7623c9ced	5000	f	budget	consumable	\N	2026-01-02 12:34:59.186514	2026-01-02 12:34:59.186514	withdrawal at handybank auburn 2 23225148	\N	\N	\N	\N	\N
85466595-c8f0-49f8-a6b0-652781724e74	9bc16a7d-0d37-4c90-90e5-55d0349afc02	1599	f	unclassified	\N	\N	2026-01-02 12:34:59.190186	2026-01-02 12:34:59.190186	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
b1a8615f-fc24-4a5e-b980-ad76c5ca241c	170380ac-931b-4d89-bf29-e8fd60311f2f	8356	t	budget	tool	\N	2026-01-02 12:34:59.193294	2026-01-02 12:34:59.193294	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
b98390c6-55fa-4a8e-b14a-5f146ecef96d	7a41474c-2dfa-420a-a6d7-b8938474f698	4500	t	budget	tool	\N	2026-01-02 12:34:59.196037	2026-01-02 12:34:59.196037	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
92237145-5428-43ad-8c82-063446252a24	6df0c240-9f44-40fb-9ec8-2e2b42113417	7970	t	budget	tool	\N	2026-01-02 12:34:59.199791	2026-01-02 12:34:59.199791	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
e8c7cbb3-36fd-4468-8016-acfb9ea1daec	c1ce58be-dac1-4ae4-bf99-c7485e2a71de	10000	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.21095	2026-01-02 12:34:59.21095	debit card purchase costco auburn lidcombe aus	misc	07f57b09-1631-42ae-8dfa-9682dba1f259	\N	\N	\N
0e794943-50d8-465d-92af-8119801985c9	4d4884a8-ccf5-46be-8802-389564d9a4e4	21339	t	budget	subscription	\N	2026-01-02 12:34:59.214289	2026-01-02 12:34:59.214289	debit card purchase budget direct toowong aus	\N	\N	\N	\N	\N
5caeac84-38cc-4625-95b6-b65cc8dcef7c	6d7af35d-ebad-4d37-8978-13dfa7b26ca3	2007	t	budget	toll	\N	2026-01-02 12:34:59.219116	2026-01-02 12:34:59.219116	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
68ad68a8-ea04-40e6-9c45-e88df869bca7	d3b96a51-8b4d-4421-9fcb-fc75827bf892	2750	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.222662	2026-01-02 12:34:59.222662	withdrawal-osko paymnet 1090990 norman glazing	supplies	d244274e-a0d2-421e-8e07-a5b351de2328	\N	\N	\N
34e53834-5d76-42b6-8d62-1a6094375956	1e527791-c4b0-4908-8a07-2e128f9c7812	215000	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.22828	2026-01-02 12:34:59.22828	deposit-osko payment 2324549 mr riccardo winston casali deposit manly windows casali manly	payments	63a9bfca-1db9-436b-ba4e-7af56a173b05	\N	\N	\N
05b56df4-81dc-4feb-aa09-c5bdf4ffa973	b5dd066b-561f-440c-af00-d2a266ce4b4c	2007	t	budget	toll	\N	2026-01-02 12:34:59.233449	2026-01-02 12:34:59.233449	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
3c88879e-da23-4c70-8a63-131107c01880	ba72aa39-1dce-451d-beb3-45e3497c29af	300	t	budget	subscription	\N	2026-01-02 12:34:59.236885	2026-01-02 12:34:59.236885	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
5738338e-20b4-4f2f-91fa-55afb3e8cb53	7b5f50a7-8e3c-40ac-a52e-c2f39401cfe0	12297	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.240999	2026-01-02 12:34:59.240999	eftpos debit 0080991 speedway woodpark woodpark	misc	275122b5-3e61-418e-9fe2-08a5f774717e	\N	\N	\N
e918313e-a120-40e7-91b1-7f869001dee7	7d023efd-0d68-41c0-9ca8-48ed58450e22	77275	t	project	\N	7b4689a1-e4cd-479a-bab9-802def112c4e	2026-01-02 12:34:59.096138	2026-01-02 12:34:59.096138	deposit-osko payment 2352629 ms jane anne berry 29 clarkes road	payments	d7088db1-54ea-4987-9ba9-3ea032c7d4d4	\N	f	\N
66abc137-7cca-4142-810f-332b739bdba1	a92f625b-6a63-4209-b950-137cabe98c5e	1026	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.16906	2026-01-02 12:34:59.16906	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	ef439239-d26f-4db3-a58e-6b03414a300c	\N	f	\N
4dc6b6e9-0f43-4304-980c-4dbb9241f6ef	a000c066-8229-42df-930b-036a51e26111	305250	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.071562	2026-01-02 12:34:59.071562	deposit-osko payment 2009721 fsf project pty ltd t/as urban fixx balcony sliding door 50 payment nbr 147	payments	89c7ef06-ba22-4900-ae99-bc5ba73a5bdd	\N	f	\N
5a7bcbb0-3567-4b23-a112-24fff48296df	6b0f2abc-dc9b-4c9f-b2db-998f06ac46d4	192500	t	project	\N	76a97d96-3b40-4c24-bfbe-e16362c59574	2026-01-02 12:34:59.103606	2026-01-02 12:34:59.103606	deposit-osko payment 2632730 kawthar haa raheemy garage door 141 & 140	payments	151a4449-abff-43c8-8f8b-232da552c81c	\N	f	\N
6d3306ed-0819-47d1-869f-b4c9954abcaa	c12bf1fe-e171-43d8-83c5-dd1dadbf2bd6	331	t	project	\N	76a97d96-3b40-4c24-bfbe-e16362c59574	2026-01-02 12:34:59.110109	2026-01-02 12:34:59.110109	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	15fa8a4d-1fa0-4035-8165-b6114ffaff94	\N	f	\N
64e722f8-7c86-4194-a988-4b1165b40337	1f1f4d3b-a32f-4a21-b06f-fa3ebb4e5c54	80000	t	project	\N	76a97d96-3b40-4c24-bfbe-e16362c59574	2026-01-02 12:34:59.121032	2026-01-02 12:34:59.121032	withdrawal-osko payment 1548740 ace garage door	supplies	c590066c-9be4-4c34-b9ec-cc7f6a3a1ddd	\N	f	\N
9ccb7596-6e4a-4752-8e36-653503ec02d1	77b94ed8-d68f-455b-a7bc-e7b458c5afa0	9043	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.253405	2026-01-02 12:34:59.253405	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	6a462ed1-c8c8-45c2-bfb8-cae691778876	\N	\N	\N
0619edbf-a284-461c-a930-1c7aa4527c52	7f9248dc-c7bf-4316-b59b-dd5cb4cdee81	1270	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.259249	2026-01-02 12:34:59.259249	eftpos debit 0430151 bp express 2250 \\ kellyville 25/08	misc	fc4e3215-7586-4f21-b491-1139961c6f58	\N	\N	\N
5c86588b-40a0-4135-b5a6-692ad8fe2ab2	81180527-8caf-41b7-89c1-d88a49530e51	2390	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.264971	2026-01-02 12:34:59.264971	eftpos debit 0430158 bp express 2250 \\ kellyville 25/08	misc	fdfae98c-93cd-4562-92b9-20422f9d5b71	\N	\N	\N
4ccb2ca2-d1fb-4041-9bc4-6a18dc17e1b5	e43c2a22-0be8-4865-8f65-5f5ca639b58c	300	t	budget	consumable	\N	2026-01-02 12:34:59.270774	2026-01-02 12:34:59.270774	debit card purchase 7-eleven 2319 northmead aus	\N	\N	\N	\N	\N
cbec3406-2ad5-424d-b25a-6d06e06441a5	7903efd3-58b9-4ea3-8114-810242c01c88	1194	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.27503	2026-01-02 12:34:59.27503	debit card purchase otr rouse hill rouse hill aus	misc	a1c4deec-9162-4adc-a439-265321eda8e2	\N	\N	\N
3551ae23-65eb-4792-b091-0dd15be098aa	db1cb0a6-e644-4006-9576-3aa704628e9c	2007	t	budget	toll	\N	2026-01-02 12:34:59.278868	2026-01-02 12:34:59.278868	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
d2119c6f-0e3e-4ea0-a1cc-b38040a087c3	a0bcc480-61d3-4688-b063-68aeb72df5b1	2007	t	budget	toll	\N	2026-01-02 12:34:59.28176	2026-01-02 12:34:59.28176	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
66d11f87-a9d6-41ea-8e9e-c9c176d598c8	e340ad87-d127-4c56-b0ac-2b9c6ffeaf9d	7700	t	budget	consumable	\N	2026-01-02 12:34:59.28519	2026-01-02 12:34:59.28519	debit card purchase post guildford west lp guildford we aus	\N	\N	\N	\N	\N
9d743441-911a-4daa-8c8f-04b7d8d627a0	f7e295f2-7e12-4e89-a901-1c8b862ebb4d	14086	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.288459	2026-01-02 12:34:59.288459	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	a5e66c35-07cb-4ed4-bbdc-127c8849a7f5	\N	\N	\N
4351a3c8-8966-4b12-9688-bb1182a89047	d9beddfe-731d-4738-9c83-76435ad992d8	24320	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.297814	2026-01-02 12:34:59.297814	debit card purchase complete lintels pty annagrove aus	supplies	b86e93ff-aef3-482e-b887-fb2286cdb905	\N	\N	\N
6e07b42f-bf2f-49d3-8ef4-09363def2df0	f26a98bd-6a7e-4650-a426-ae3c7cd79dd7	2945	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.303055	2026-01-02 12:34:59.303055	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	96796430-c93e-47f0-9d47-fde2268d6e66	\N	\N	\N
5092acb3-2ad6-47c0-a421-c5f9b6f3c196	a7c62f6b-4bde-412e-8e87-8b1fe0978715	12638	t	budget	tool	\N	2026-01-02 12:34:59.308434	2026-01-02 12:34:59.308434	debit card purchase bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
9064303f-b0d5-4f43-bc4a-2b0eec51781c	bef76746-7d2b-400d-bdf7-97ecef0609b3	12969	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.312018	2026-01-02 12:34:59.312018	debit card purchase bunnings group ltd hawthorn eas aus 	supplies	ed47ecb9-17a7-4ade-a277-2e38995f4bc5	\N	\N	\N
802df93e-643a-43b0-bec9-b11e420425a1	eb480dff-52ba-4356-80f5-13300aa4e08a	35000	t	budget	tool	\N	2026-01-02 12:34:59.321267	2026-01-02 12:34:59.321267	withdrawal-osko payment 1117838 hua long international p/l t/a ozne	\N	\N	\N	\N	\N
d364c1d0-8eb8-4fd6-97b5-343a8b3db5ca	45060778-db01-4104-8698-45485c47f4af	150000	t	refunded	\N	\N	2026-01-02 12:34:59.325939	2026-01-02 12:34:59.325939	deposit-osko payment 2277106 ms qihua lin cancel order. refund cancel order.	\N	\N	\N	\N	\N
3c3ba958-3066-4560-b511-7fa0cd539e6b	f064c5c6-d514-4611-a388-4804b97fb893	300	f	unclassified	\N	\N	2026-01-02 12:34:59.331867	2026-01-02 12:34:59.331867	trasaction fee	\N	\N	\N	\N	\N
d19cf7d2-a6e1-4f31-92cc-736f5cabb6c5	9b73ea8e-04ff-41a9-afe5-0c91ba149c66	6616	t	budget	subscription	\N	2026-01-02 12:34:59.335129	2026-01-02 12:34:59.335129	debit card purchase ezi*biz cover (no.3) sydney aus	\N	\N	\N	\N	\N
5eb39a87-960b-4408-b656-6c8a064f1fb8	84519c12-7732-4026-b794-300f1f1ae6e9	47190	t	budget	subscription	\N	2026-01-02 12:34:59.338051	2026-01-02 12:34:59.338051	debit card purchase home improvement pages sydney	\N	\N	\N	\N	\N
df4088cc-bb49-4106-8832-7aaeb3502c3d	ed036bd3-505c-4679-b07f-2d39f25a5743	150000	t	refund	\N	\N	2026-01-02 12:34:59.341597	2026-01-02 12:34:59.341597	withdrawal-osko payment 1080741 normn glazing rick gary	\N	\N	\N	\N	\N
f03dcab9-3403-42c2-a34b-cb6e94ca6653	f946be77-506c-459f-add8-f6d926629b47	120000	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.345846	2026-01-02 12:34:59.345846	withdrawal-osko paymen 1210338 walco aluminium pty ltd	supplies	460b44c9-18ea-430e-b2f7-4243ae362bc3	\N	\N	\N
d187a224-192d-4421-85bb-e32be31e7d30	0dab36c2-1919-4e9b-86e0-56ffef34d05c	2299	t	budget	consumable	\N	2026-01-02 12:34:59.358526	2026-01-02 12:34:59.358526	debit card purchase post merrylands post s merrylands aus	\N	\N	\N	\N	\N
fc4e1273-7021-41b3-8e1f-5428006a18f6	bb28eeec-eaf6-4e2e-9724-00cff8e8f6d3	10000	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.36395	2026-01-02 12:34:59.36395	debit card purchase costco auburn lidcombe aus	misc	13da6994-ed87-4cd1-95df-6850143e75f7	\N	\N	\N
fff34c2a-3979-4162-84e1-ec40e3dd84c6	6861d6bf-1f39-4dfa-aa04-89f1bd3da006	77200	t	budget	consumable	\N	2026-01-02 12:34:59.368282	2026-01-02 12:34:59.368282	debit card purchase snsw merrylands merrylands aus	\N	\N	\N	\N	\N
2f6c4e2f-9d24-4c16-91b3-e43980163d71	f1f9c0ff-10c3-4486-b66b-1ee1238f28e2	695	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.387338	2026-01-02 12:34:59.387338	debit card purchase otr pennant hills east pennant hill aus	misc	299dc266-ea7e-4e39-8160-a6ea83e2e1a4	\N	\N	\N
4a7f83c5-5370-4f07-9b57-0aaaffb9495c	1d6d5c9c-ab81-44f7-8051-0b4ab5e2eb28	3299	t	budget	consumable	\N	2026-01-02 12:34:59.392662	2026-01-02 12:34:59.392662	eftpos debit 0127176 apple\\apple.com/bill\\mv2nqkv1kda0	\N	\N	\N	\N	\N
14ef9b74-cd5e-41cd-92e7-949b92358b11	e16be88d-b2ff-4f31-acce-e68a23e1524b	166650	t	project	\N	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	2026-01-02 12:34:59.397968	2026-01-02 12:34:59.397968	deposit-osko payment 2540971 christopher lipman nbr 145 nbr 145	payments	99676fcf-8f3a-420c-91cb-11fd7cbdbce8	\N	\N	\N
db318b8f-0347-4645-a6a9-397563058969	f0d51192-2c68-41f4-8a50-c9ae97d9c8e1	316250	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.404236	2026-01-02 12:34:59.404236	deposit-osko payment 2975680 srb (nsw) pty ltd deposit installation maroubra nbr	payments	9d9197a6-036b-47c7-8f18-46501557284b	\N	\N	\N
d6445f9c-5495-40ee-8f86-bf7ac398b8d3	751837ee-88e6-4519-9911-2eacfcd4665a	2007	t	budget	toll	\N	2026-01-02 12:34:59.408057	2026-01-02 12:34:59.408057	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
ee0e2493-4a93-4106-aeb7-9e1d49c3b6f8	7f601cbf-4b5d-4eec-8ff5-3f6bd5806a11	2007	t	budget	toll	\N	2026-01-02 12:34:59.412444	2026-01-02 12:34:59.412444	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
5cab66be-1325-4c78-b694-429aa404cebd	48fa13bc-3480-4f9a-b41f-98b50b8a2731	2007	t	budget	toll	\N	2026-01-02 12:34:59.415653	2026-01-02 12:34:59.415653	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
4245b7b1-4e70-484d-94c0-05c5b0dcd2de	a9c41e5d-68c0-48ad-aeb3-f57acb230769	1945	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.427044	2026-01-02 12:34:59.427044	debit card purchase woolworths 1103 lane cove aus card	misc	64bb8a09-6051-49bf-874e-e2bd23ec1f2e	\N	\N	\N
e37f4068-a5d4-4157-b616-7978b168892e	2a59fc31-37b9-4e69-8daa-7dc69f5f77d9	4823	t	budget	tool	\N	2026-01-02 12:34:59.432693	2026-01-02 12:34:59.432693	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
7122a519-31b8-47d5-9cdc-cf5fb0c58380	98830735-6eb5-4f70-89f5-f727f3535e9f	2007	t	budget	toll	\N	2026-01-02 12:34:59.435911	2026-01-02 12:34:59.435911	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
d3e563ae-2740-4dae-a2e4-19bf727fe354	e1663b06-2a0d-4e7e-84de-2d8b0996a223	4233	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.439151	2026-01-02 12:34:59.439151	debit card purchase bunnings group ltd hawthorn eas aus	supplies	28f00900-161f-49e4-a800-872a63acfca7	\N	\N	\N
03ef0957-03cd-462c-a6a6-c1aea36e7d9e	1cffe4d5-cc96-48c7-9192-4ae53785c95c	10000	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.446091	2026-01-02 12:34:59.446091	debit card purchase costco auburn lidcombe aus	misc	8f189de1-cfa2-44fc-acfc-0ee8b218f3e3	\N	\N	\N
dd6be0c5-3c28-43ac-8884-28f5bc9de75d	8aa2a420-6841-4315-acc2-21290e560960	340000	t	project	\N	af77b699-a683-496f-9a9e-61a7dca30b3d	2026-01-02 12:34:59.45253	2026-01-02 12:34:59.45253	deposit-osko payment 2079437 fiona may deposit phillip bay nbr	payments	b7c62fbe-9cf1-4ad0-8c9d-599d886b3b7f	\N	\N	\N
fb6c4307-e2c1-41b0-8d95-26da64c48643	df95752c-e6db-4adf-8f2c-818295a210a8	948	t	budget	tool	\N	2026-01-02 12:34:59.457224	2026-01-02 12:34:59.457224	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
9127504e-4b3d-42ac-953d-aa6e39d05444	70a202c9-bf6b-4592-b89a-d778a28a45b8	2007	t	budget	toll	\N	2026-01-02 12:34:59.460641	2026-01-02 12:34:59.460641	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
9a6f9041-4a05-4bfd-b5cf-b47256430902	0d5672a9-7385-4793-8afb-70d28fcb08a3	46750	t	project	\N	42681f0f-6c97-4d1a-ab16-afc072737570	2026-01-02 12:34:59.421157	2026-01-02 12:34:59.421157	deposit gary davies balanceinvoice 149	payments	c23a581c-4df2-47d4-8a71-551cc35a84e0	\N	f	\N
6ef6d2e7-deaf-4591-8526-b521ed30a490	b994572e-bbdd-4bf8-9ed6-303b93605788	80000	t	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.3532	2026-01-02 12:34:59.3532	deposit crownview projec 133 additional	payments	dc0d151d-9707-4250-bd4d-f9bb4558c07c	\N	f	\N
709f56a4-7dc9-4ad1-ab78-75c7f5aebcf1	5124579c-1ad2-471b-8c9f-8f737e61cc38	20000	f	project	\N	690b704e-00f1-4669-ba84-0313730faf10	2026-01-02 12:34:59.372955	2026-01-02 12:34:59.372955	withdrawal-osko payment 1856544 ahmed hasan ahmedalhamded	labors	260ba683-6e63-4740-8e44-930444219a09	\N	f	\N
913472ba-a1a9-411a-baa9-45929d194fb0	2f16a698-0249-4a97-8999-2f1a9e9d6088	20000	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.293371	2026-01-02 12:34:59.293371	debit card purchase kennards hire ho nsw 2 seven hills aus	misc	defa2539-4580-48b3-bcb0-02fd3bd9b65e	\N	f	\N
85f5fc16-3f05-423d-a5ed-0c0ee50c6956	3615818a-eb75-4fd5-8b09-3720265bea4f	150000	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.382243	2026-01-02 12:34:59.382243	deposit-osko payment 2863883 fsf project pty ltd / as urban fixx nbr 137 second	payments	c253c63a-4b3b-41bb-9527-c4bbf2acf548	\N	f	\N
90edd2a7-3655-4dd0-8fba-6677f0172d36	2d4f031b-e34a-4642-8e3f-aa6bdbcd7edc	4437	t	budget	consumable	\N	2026-01-02 12:34:59.464684	2026-01-02 12:34:59.464684	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
e19b275b-d1fe-4f91-afbf-9b3778716485	683df882-8d2f-42e7-bd7c-797b48b8e91a	1899	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.476471	2026-01-02 12:34:59.476471	debit card purchase metro rosebery rosebery aus	misc	1d6ff671-0a59-4c66-890d-765bdbd609bb	\N	\N	\N
afd55be1-507d-4145-bbed-95a20e714ed4	76f07ebe-31af-49b4-b780-e63df3d57009	2007	t	budget	toll	\N	2026-01-02 12:34:59.48177	2026-01-02 12:34:59.48177	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
1e1fd011-e5bd-4c80-a3e6-beb0d1d14fe4	e46c1d35-b850-439f-9c3d-808d9190f21f	2851	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.486093	2026-01-02 12:34:59.486093	debit card purchase bunnings group ltd hawthorn eas aus	supplies	4584ce4b-cb57-44ae-9465-67c09e1b4cee	\N	\N	\N
67e1b191-0419-41b8-9596-c8554cfe48dd	205e7272-33cf-4624-9017-045cfb4afe6c	3150	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.492504	2026-01-02 12:34:59.492504	debit card purchase inspire international eastgardens aus	misc	4323b198-9c90-4821-9e14-36c8e5fe67fb	\N	\N	\N
80402231-3bfa-4f5c-bd84-7ba5d76bc0d6	12131a41-d4ef-40fe-a210-d717a22bc1ef	7689	t	budget	tool	\N	2026-01-02 12:34:59.498028	2026-01-02 12:34:59.498028	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
eeb67c2e-0e2a-4005-a561-cff9e664e08a	103beff4-35e9-4493-a730-9b1f3aec497b	4200	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.503137	2026-01-02 12:34:59.503137	eftpos debit 0322229 el jannah randwick randwick 10/09	misc	6536da88-40a2-4ef8-b3c5-872a4cbe25f7	\N	\N	\N
dd654fc9-b0bd-44ad-8c1b-1124b0d5b0e9	e82ee4cc-24c7-4fbf-81b9-b86701efb1a1	1115	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.50847	2026-01-02 12:34:59.50847	eftpos debit 389637 fresh bowls and acai randwick 10/09	misc	8275753d-cb65-47b3-8ff2-fb66b54873c4	\N	\N	\N
777f612c-e9ff-4bfc-b3f2-e25e5ff180fd	36279324-88f4-4d47-bef6-d3fef0701dda	405350	t	project	\N	af77b699-a683-496f-9a9e-61a7dca30b3d	2026-01-02 12:34:59.590701	2026-01-02 12:34:59.590701	withdrawal-osko payment 1899884 mr top group pty ltd fiona	supplies	a1236308-60aa-4dfd-bda1-62496002e1be	\N	\N	\N
002e04c5-aa42-41ff-b1f6-171bd1749904	238f6572-c612-4d53-944a-d1265d8d282e	2007	t	budget	toll	\N	2026-01-02 12:34:59.596758	2026-01-02 12:34:59.596758	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
f0dae6be-809b-4dff-b59f-e9bcb92555ff	b562f3d3-092c-439b-be0b-ce248dd99602	7200	t	budget	tool	\N	2026-01-02 12:34:59.601291	2026-01-02 12:34:59.601291	debit card purchase kmart 1399 merrylands aus	\N	\N	\N	\N	\N
d9b1427c-cda1-4946-bf96-1978770c45d8	f702856a-a1d0-455b-9082-5d3b9192289f	32461	t	budget	tool	\N	2026-01-02 12:34:59.609623	2026-01-02 12:34:59.609623	debit card purchase hogans wholesale wetherill pa aus	\N	\N	\N	\N	\N
348c9474-0df0-4e6e-b3da-7d2d82b41218	9f767a3b-8f32-4ff5-993b-94802452cc97	83911	t	project	\N	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	2026-01-02 12:34:59.621749	2026-01-02 12:34:59.621749	debit card purchase walco aluminium pty south granvi aus	supplies	45dccb70-2de8-450c-a0e0-983b9a4b9980	\N	\N	\N
7193a11f-d299-40e1-a022-aafc309a333f	590bb7c7-138d-4d49-bfa9-e7943424100d	2007	t	budget	toll	\N	2026-01-02 12:34:59.641422	2026-01-02 12:34:59.641422	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
d26c09d6-d047-4829-b19e-a1f8bde92016	8e3f89a4-9dfb-4eb7-a985-64fd4daa0abd	10000	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.647465	2026-01-02 12:34:59.647465	debit card purchase costco auburn lidcombe aus	misc	563962db-16fa-4416-91bb-15897f5aa906	\N	\N	\N
f0c281fb-77a4-4d34-93e3-287c6c63cb30	3d568436-9bc2-4b7d-bd05-d72f006faad5	19079	t	budget	subscription	\N	2026-01-02 12:34:59.651897	2026-01-02 12:34:59.651897	debit card purchase ezi*biz cover (no.3) sydney aus	\N	\N	\N	\N	\N
02ea7de9-dee8-4d03-81de-2729f4eb56c2	cab2d1f1-897e-45bd-bf4d-164e4afccd98	4200	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.665899	2026-01-02 12:34:59.665899	eftpos debit 0752099 el jannah randwick randwick	misc	b8a05734-2973-483d-81c5-867e7ba29332	\N	\N	\N
15b70560-2a4b-407b-b0c5-1bc8a68d036d	31948be5-e173-49de-a61e-c0917a5b3601	245036	t	project	\N	d23c367d-7648-4f2e-bb88-775552ead5a9	2026-01-02 12:34:59.672895	2026-01-02 12:34:59.672895	deposit-osko payment 2899716 t & h corby pty ltd nbr 261 trent lindfield lindfield	payments	8350c910-2f19-4100-b6ac-f4f3815c5684	\N	\N	\N
bfbb5c93-7edd-48c1-a9d2-60a48fc8cca7	ea565712-2d67-4e22-b303-2e5766ecaa34	700	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.680463	2026-01-02 12:34:59.680463	debit card purchase eg group 1460 strathfield aus	misc	539b4792-90e8-4740-8a3e-164daeb66bb3	\N	\N	\N
a3b43488-7289-461e-9460-4994571f5658	fafab683-bfc9-47ac-aff8-b7aad17797ab	2007	t	budget	toll	\N	2026-01-02 12:34:59.684611	2026-01-02 12:34:59.684611	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
447537d9-3b49-40e2-8ebb-fc83a34e644e	558fff3d-475c-46e3-ae25-dd49544be3df	2007	t	budget	toll	\N	2026-01-02 12:34:59.687501	2026-01-02 12:34:59.687501	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
62d9865f-0e4e-437a-9181-e16f960b825e	bd721903-6fdb-4414-8bb3-b3d2b11a051e	2007	t	budget	toll	\N	2026-01-02 12:34:59.69011	2026-01-02 12:34:59.69011	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
2df6dbc7-0d85-472b-8216-0722e2edf336	f3e6b24b-b8dd-4b1a-b842-62b4df42177f	2450	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.696049	2026-01-02 12:34:59.696049	debit card purchase ampol coogee s 22392f south coogee aus	misc	756ed330-f1fc-41eb-9df5-eaaa47de000e	\N	\N	\N
8466a025-1c11-4d39-9fd3-471503fff011	1c3319fc-cb39-480d-935e-4645a3daacf4	3464	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.700976	2026-01-02 12:34:59.700976	debit card purchase bunnings group ltd hawthorn eas aus	supplies	ba690e2a-66b9-451c-8326-74c5ac0303cc	\N	\N	\N
014c6f0b-c80d-4fd2-947f-e4b11502fe1f	fdaba1ca-ad0f-454f-8621-b3caa04d35b6	76010	t	project	\N	d23c367d-7648-4f2e-bb88-775552ead5a9	2026-01-02 12:34:59.705531	2026-01-02 12:34:59.705531	withdrawal-osko payment 1856414 walco aluminium pty ltd q154065	supplies	1428c53b-3d0c-4141-a27f-df3490a6eb2e	\N	\N	\N
7be57c15-9948-45d4-9c75-0d1ea07a1334	6c9b6534-09ba-411d-add3-6cc9499d5ea5	196900	t	project	\N	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	2026-01-02 12:34:59.710849	2026-01-02 12:34:59.710849	withdrawal-osko payment 1870354 walco aluminium pty ltd jessy cash account	supplies	6a022a2c-cd80-4e03-a00a-ef3dcaa572f6	\N	\N	\N
d1ca9f32-c5d5-4494-992a-4dcbbcf16aa5	7b637535-03f9-4dec-b5d4-1e945f6a5cde	9834	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.726011	2026-01-02 12:34:59.726011	debit card purchase bunnings group ltd hawthorn eas aus	supplies	1c1f9f03-aa5e-4ebf-99e9-0d6db73e9793	\N	\N	\N
83005d7d-85ca-4b58-9a8a-a8342d0c86d0	2478d95d-a774-4bcb-b069-c406246cb68e	21339	t	budget	subscription	\N	2026-01-02 12:34:59.73116	2026-01-02 12:34:59.73116	debit card purchase budget direct toowong aus	\N	\N	\N	\N	\N
a8495748-82c4-4568-b71a-5d77ffb24026	8109af46-7d93-4cdd-8b32-195aaa87acb3	4320	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.735765	2026-01-02 12:34:59.735765	eftpos debit 0432073 el jannah  randwick randwick	misc	06fe88ce-f5c7-4ef4-bc48-a377d361617d	\N	\N	\N
9e4eba90-04d3-4ec9-95d5-2f1970a5550b	c993db72-7b9f-49de-aa5e-d63120329993	950	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.741557	2026-01-02 12:34:59.741557	debit card purchase ampol coogee s 22392f south coogee aus	misc	dd20c271-6c88-40ac-90fd-620ddfc637b3	\N	\N	\N
2cbe3657-2305-4d7c-8155-d5ae9aaf28db	c14dd9d4-ffd5-4353-8add-3c26eb77d838	2007	t	budget	toll	\N	2026-01-02 12:34:59.746301	2026-01-02 12:34:59.746301	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
c4869aeb-c37e-46dd-bb41-749ebee6728b	1234e802-5c7c-4e72-a6ed-2d3aa8c3d4fa	4012	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.751378	2026-01-02 12:34:59.751378	debit card purchase 7-eleven 2011 guildford we aus	misc	43308052-25d7-486b-9eb9-74c4056e92d8	\N	\N	\N
2b381a1e-b13f-4085-88e1-27151fb4ad5c	22923487-db84-41ad-9f64-dfda075b45b9	4736	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.755859	2026-01-02 12:34:59.755859	debit card purchase bunnings group ltd hawthorn eas aus	supplies	53a1bfc9-37b9-4623-99db-c9f5a280ba50	\N	\N	\N
c11098dc-d615-4f44-9977-66276bc5ad84	8fcdb607-4ba5-4fbf-8f9b-6697b6c405e7	300	t	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-02 12:34:59.762663	2026-01-02 12:34:59.762663	eftpos debit 0228337 reddy express 1605 forestville	misc	b9740582-4c9f-4b40-85fe-6f8befbf835b	\N	\N	\N
3f945a15-c899-452b-9d91-f48a87f5a7ca	bf12a191-a55a-4fbf-b85c-21d82e2faaae	2007	t	budget	toll	\N	2026-01-02 12:34:59.766456	2026-01-02 12:34:59.766456	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
d377cb12-25fd-486f-b3b8-bd1ac2ee2f33	1b992b98-c8a6-4c9f-ac49-e9480580996a	18059	t	project	\N	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	2026-01-02 12:34:59.770947	2026-01-02 12:34:59.770947	debit card purchase walco aluminium pty south granvi aus	misc	d8341d7b-88d6-43ad-ac4e-636da2c53263	\N	\N	\N
5397b902-d9df-4f37-9544-3de35e969c7f	8c50d59f-8f40-4563-a37f-0bc897bc1449	600	t	refund	\N	\N	2026-01-02 12:34:59.77479	2026-01-02 12:34:59.77479	debit card refund kennards hire ho nsw 1 seven hills aus	\N	\N	\N	\N	\N
d280ffbf-b968-475e-b83d-8ffe30276377	30187366-50c6-4838-8254-28f083af49d8	2007	t	budget	toll	\N	2026-01-02 12:34:59.777974	2026-01-02 12:34:59.777974	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
c7ad2f8d-e252-4a9f-980c-9a1f61db2a4e	67d3c5ed-a7da-48be-ae0e-815a303174c2	2007	t	budget	toll	\N	2026-01-02 12:34:59.782602	2026-01-02 12:34:59.782602	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
5db3b113-2610-4191-940b-cdf03ebbb060	6474ae95-c433-4311-a095-b51395b8df1d	3820	t	project	\N	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	2026-01-02 12:34:59.787203	2026-01-02 12:34:59.787203	debit card purchase shivom pty limited erskineville aus	misc	8f1b1955-d5aa-43eb-8f77-b5a423fe3fa3	\N	\N	\N
5fd9d476-4415-46eb-9bb9-4a62b0e51360	8484fd54-b9e3-43cd-a4a4-b37e48850d5c	155250	t	project	\N	b4c26b44-88bc-4194-a735-7c45a3e9a497	2026-01-02 12:34:59.72151	2026-01-02 12:34:59.72151	deposit-osko payment 2999322 fsf project pty ltd t/as urban fixx nbr 136 final payment nbr	payments	17ba1733-0fa8-41b2-9718-b6ed6b12f757	\N	f	\N
1e7a80b7-6411-49d2-8c4b-a055f4453bd7	8d720c05-4bf7-421e-b05a-d16831c2d2a4	110000	t	project	\N	35e96736-2752-4b0d-a07e-c25dc5b3c572	2026-01-02 12:34:59.657789	2026-01-02 12:34:59.657789	withdrawal-osko payment 1206097 mr top group pty ltd	supplies	32e4d189-b947-4fc7-9e51-0489ef778a0b	\N	f	\N
71da7a9f-e797-406a-9421-659b1a17c1e5	097fddea-2b57-4569-9e4d-dfe869ef37f9	49500	t	project	\N	1d8af109-85f2-4ab0-8f4c-b5717cf8e0f8	2026-01-02 12:34:59.630229	2026-01-02 12:34:59.630229	deposit-osko payment 2008659 frank abate invoice 154 sliding window	payments	7261e0d9-5aa3-4ee9-ae42-2e69e34a92b5	\N	f	\N
deacdddd-a865-4416-92b0-eb14ab34ad0f	5817d3be-3fbe-41a5-b164-86d8d6d64208	11000	t	project	\N	1d8af109-85f2-4ab0-8f4c-b5717cf8e0f8	2026-01-02 12:34:59.637357	2026-01-02 12:34:59.637357	deposit-osko payment 2989933 frank abate invoice 155	payments	271e2c0c-8a12-4ef3-84b8-9875d4fcba71	\N	f	\N
f0cd6011-7e8d-451f-94a6-65ce11a19438	facc5cd3-fd16-4625-90cc-7b4588e2e54e	4263	t	budget	tool	\N	2026-01-02 12:34:59.790916	2026-01-02 12:34:59.790916	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
2551e996-a8c1-4d25-9a49-4d7892a8a18c	e0539ce3-0732-4377-82d5-22def50eac23	7200	t	project	\N	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	2026-01-02 12:34:59.797108	2026-01-02 12:34:59.797108	debit card purchase kennards hire ho nsw 1 seven hills aus	misc	f2e174d2-1552-4f33-a669-86045865c41b	\N	\N	\N
f5607da4-9c6b-48a3-bc77-fd63a0e5ea25	d6d494c3-a629-49db-9c9d-7f4f25e31afe	11848	t	project	\N	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	2026-01-02 12:34:59.802828	2026-01-02 12:34:59.802828	debit card purchase costco auburn lidcombe aus	misc	483b6c5b-fb4c-4122-b426-ba3a2c2198ca	\N	\N	\N
4fb86121-5771-43a9-95d9-c27021eb086b	b6db1e6b-2d97-4af6-8c35-67fd56d40014	22447	f	budget	salary	\N	2026-01-02 12:34:59.806415	2026-01-02 12:34:59.806415	debit card purchase zamzam village groce auburn aus	\N	\N	\N	\N	\N
7ea4d3eb-6ac5-4194-9619-c4b3da5b9099	c8abc1ac-29f9-4af5-95ad-29f12dc1262b	65890	t	budget	subscription	\N	2026-01-02 12:34:59.81	2026-01-02 12:34:59.81	debit card purchase home improvement pages sydney	\N	\N	\N	\N	\N
69bbc55a-a1b1-4eb0-a5cd-40368d3ad129	9409296f-be30-436e-a058-2a70ac6de76a	600	t	project	\N	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	2026-01-02 12:34:59.81676	2026-01-02 12:34:59.81676	eftpos debit 0089368 shell reddy express babass hill	misc	59045761-c6e0-4621-9463-1d03b42f7b46	\N	\N	\N
1d9394c3-daf4-4f40-94e0-4f4dd269d8e7	d1fefff0-9474-491c-b8d6-174007e6d1c8	166650	t	project	\N	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	2026-01-02 12:34:59.821879	2026-01-02 12:34:59.821879	deposit-osko payment 2867570 christopher lipman nbr145 - st john rd glebe inv145	payments	e1bec778-def2-4b4e-88a0-431a07813b1a	\N	\N	\N
82b4341e-daaf-406a-8cb7-d3faa2f94a71	15583197-31ad-4a23-93c0-0618616a8713	600	t	project	\N	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	2026-01-02 12:34:59.827529	2026-01-02 12:34:59.827529	debit card purchase 7-eleven 2254 north ryde aus	misc	2790cbb0-1c32-4293-8c14-a4fadf19142d	\N	\N	\N
6172fdfd-dd6a-4081-bffc-2f767a003422	82e4f072-7728-40a6-adc9-4dfded4cc26f	2007	t	budget	toll	\N	2026-01-02 12:34:59.832315	2026-01-02 12:34:59.832315	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
37798ffa-bb6a-48a1-b7c3-4f7ffe567bdd	409f4ac7-4965-4f48-a88c-e8cd77d7c22d	5018	t	budget	toll	\N	2026-01-02 12:34:59.835868	2026-01-02 12:34:59.835868	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
9df025ae-b810-442d-820e-21de950ebf90	47daccd6-554c-4db4-a1cb-89fe7ca74980	33493	f	budget	salary	\N	2026-01-02 12:34:59.839438	2026-01-02 12:34:59.839438	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
1629ecc6-91d7-494d-8eb3-f1cdaef43cc0	bf945764-37c2-44e4-833e-f9bc2aec31b5	49000	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:34:59.843581	2026-01-02 12:34:59.843581	withdrawal-osko payment 1244352 sydney skip bin guy	supplies	4582ce92-1ba7-48e0-af91-fc5c06447ad9	\N	\N	\N
90e978f9-8426-4108-96b5-35f68a7e8d5f	29658d4a-322a-4673-991c-dba9ec5ae7a0	82830	t	project	\N	a7edf71d-c062-4f95-9e3c-d8bc8c532983	2026-01-02 12:34:59.849314	2026-01-02 12:34:59.849314	withdrawal-osko payment 1109114 walco aluminium pty ltd sujal	supplies	9ed980cd-c7fa-4be8-9ee1-687e1d1a7a3b	\N	\N	\N
b68f029c-dc5a-4538-8f22-0605fb9c0c6f	f7831e91-3efa-442a-a3fb-40e38b6fcf12	94820	t	project	\N	d23c367d-7648-4f2e-bb88-775552ead5a9	2026-01-02 12:34:59.854788	2026-01-02 12:34:59.854788	withdrawal-osko payment 1136464 walco aluminium pty ltd trent	supplies	3d839f8f-b44d-460e-9bab-d6f0bd557656	\N	\N	\N
48bac2ae-cb45-4eb4-8f94-f402dd6af9b4	10d223e2-4ccf-4105-94df-e4eee5a270cf	4200	t	project	\N	35e96736-2752-4b0d-a07e-c25dc5b3c572	2026-01-02 12:34:59.860367	2026-01-02 12:34:59.860367	eftpos debit 0188188 el jannah burwood burwood	misc	81cf2a4d-7fc9-43cb-8d2d-f102dcee24aa	\N	\N	\N
9e659179-d35e-4197-ad73-3d585a7e2f7b	1e034951-894a-4a44-8c7b-d7f910d92760	1300	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:59.867251	2026-01-02 12:34:59.867251	debit card purchase 7-eleven 2224 granville aus	misc	77c79b43-2b93-4b99-bcfb-d183c86224fc	\N	\N	\N
c3207f84-caa5-4e48-8fba-d6f9ebfe4262	c8377904-7164-4ede-b4bc-38ea165b387a	5018	t	budget	toll	\N	2026-01-02 12:34:59.872059	2026-01-02 12:34:59.872059	debit card purchase linkt sydeny sydney aus	\N	\N	\N	\N	\N
7e0753dd-4388-4850-ae25-b79f4456f440	c0c17920-20d6-40b3-a1a7-1a8a2cb38ae1	8000	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:59.87678	2026-01-02 12:34:59.87678	debit card purchase costco auburn lidcombe aus	misc	f36b616d-4d06-4cfe-a5d1-c48f9f568c37	\N	\N	\N
4b031e36-aee4-451b-9b17-d87c46a7754b	ccfbd0a4-f80a-4c3e-89dc-d951b882ed90	70000	t	budget	consumable	\N	2026-01-02 12:34:59.88887	2026-01-02 12:34:59.88887	withdrawal mobile 1409963 pymt starr part house&workshop rent	\N	\N	\N	\N	\N
1dcdb12d-fcef-4cf6-8251-5e1f58ee3890	66fc80ca-f30a-4560-975c-d3091c730e92	190000	f	project	\N	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	2026-01-02 12:34:59.894278	2026-01-02 12:34:59.894278	deposit-osko payment 2168787 mei kitty windows	payments	2afb6b8e-89bb-4f78-bc91-3d4e9d4e1f32	\N	\N	\N
b438e48b-7e49-4803-ad99-2bc1474774e9	91a310f2-4a14-4ab7-af45-3b0d2a4c29e2	1797	t	project	\N	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	2026-01-02 12:34:59.900518	2026-01-02 12:34:59.900518	debit card purchase costco auburn lidcombe aus	misc	436e6458-2983-490e-b760-b144cd67c8a8	\N	\N	\N
f68228e8-533f-44a2-b7e9-b47601f05dd2	a18c3b9b-afb4-4779-b807-731dad8c7fa7	6248	t	project	\N	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	2026-01-02 12:34:59.906997	2026-01-02 12:34:59.906997	debit card purchase costco auburn lidcombe aus	misc	7a4e3554-bfbb-40cf-9ac1-c0a6567c35c1	\N	\N	\N
fb5191d8-f6b8-4d06-bb4e-32d2a04affc1	0a721a34-1469-48c5-ab0f-4969317530c4	70000	t	project	\N	ea74d278-b4c1-4f03-9ae9-426764acce85	2026-01-02 12:34:59.91325	2026-01-02 12:34:59.91325	deposit-osko payment 2114290 aaa bayside homes pty ltd	payments	d5cfe651-acfa-4b00-8d53-30d027d711f6	\N	\N	\N
8c82dda9-14a3-4d8e-ae1d-6c17d8b462f7	60d2c220-6225-4427-9221-3c930d90d52e	240790	t	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:34:59.921612	2026-01-02 12:34:59.921612	deposit-osko payment 2145541 quoc tran huy	payments	7520f241-0077-494c-aa2a-5406201298cc	\N	\N	\N
3f20ab82-1143-4cd6-98a2-14428b131257	726abd85-02d2-4c72-a951-65498574f098	269000	t	project	\N	af77b699-a683-496f-9a9e-61a7dca30b3d	2026-01-02 12:34:59.927634	2026-01-02 12:34:59.927634	deposit-osko payment 2638591 fiona may 25 on delivery plus timber reveals	payments	6ca115c3-406d-4660-ab97-bde834016aff	\N	\N	\N
1ddb7531-5a77-4b6e-a2fe-827acbbeeb0b	4d8512d1-3f84-44e4-a5e3-53860199edca	9918	t	project	\N	af77b699-a683-496f-9a9e-61a7dca30b3d	2026-01-02 12:34:59.933424	2026-01-02 12:34:59.933424	debit card purchase costco auburn lidcombe aus	misc	75c73c1b-6099-4a8a-9664-2a96f2f405d1	\N	\N	\N
3444e643-7c1f-4c59-8599-c2ecc1b9be5c	0ded684f-c00e-4125-a754-214835851961	4060	f	budget	salary	\N	2026-01-02 12:34:59.937922	2026-01-02 12:34:59.937922	withdrawal-osko payment 1131313 a al-matari balance	\N	\N	\N	\N	\N
7dd10c8d-18fd-4446-ae13-736e9d01454d	58764a24-1184-4e25-b500-91904038f2f1	137500	t	project	\N	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	2026-01-02 12:34:59.941402	2026-01-02 12:34:59.941402	withdrawal-osko payment 1133349 mr top group pty ltd sabriti	supplies	134f4f68-2a81-441a-bef9-798d36b1ebec	\N	\N	\N
32becd4e-9be0-4a26-adce-c3c85dd95461	3cce74c0-c011-4dd7-bc0b-0207eac2f051	3946	t	budget	food	\N	2026-01-02 12:34:59.94563	2026-01-02 12:34:59.94563	eftpos debit 0071762 reddy express 1572 northmead	\N	\N	\N	\N	\N
1861263f-d511-4f7a-8f9b-58b7354bb4bf	73e76b83-6f80-4f14-9bdf-bd9ec960f5f1	8398	t	refunded	\N	\N	2026-01-02 12:34:59.94831	2026-01-02 12:34:59.94831	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
c3867b0c-893c-4163-87af-26bc7d43bdf0	6982d6e9-d0a1-4ce4-b885-e572e5c8b999	5018	t	budget	toll	\N	2026-01-02 12:34:59.951952	2026-01-02 12:34:59.951952	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
36fe4e15-e700-4538-acdc-81063b9b9fd5	0d5c16a5-64f6-46c0-ac4e-be5b538d9387	8398	t	refund	\N	\N	2026-01-02 12:34:59.956537	2026-01-02 12:34:59.956537	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
be00214d-6807-4bdb-acef-1d821e13d903	826a2c0e-96b7-4b8e-a9b2-c1e2bf712565	10429	t	budget	consumable	\N	2026-01-02 12:34:59.960051	2026-01-02 12:34:59.960051	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
c9f15435-5835-4dd7-a594-0c6ede7ca298	047d7e58-af08-4170-bfad-d4c31a6dfcc9	75000	f	budget	salary	\N	2026-01-02 12:34:59.962776	2026-01-02 12:34:59.962776	withdrawal-osko payment 1542872 a al-matari	\N	\N	\N	\N	\N
303af7f2-4e39-4c4d-8492-217218308f37	b53f7bb4-008a-465a-bb68-0dd605a655a8	9144	t	refunded	\N	\N	2026-01-02 12:34:59.965387	2026-01-02 12:34:59.965387	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
8285fee7-aeed-4a98-8e5f-dc5e3b84b89b	18109c94-2491-4ed3-95ff-8d5e4a0f2022	21336	t	project	\N	af77b699-a683-496f-9a9e-61a7dca30b3d	2026-01-02 12:34:59.969239	2026-01-02 12:34:59.969239	debit card purchase bunnings group ltd hawthorn eas aus	supplies	67239546-fbc3-40c1-a9ec-dbe5e62b9336	\N	\N	\N
abb7fae1-6b7c-4a17-8e94-7d7eb3de1438	0f9c9162-ec5f-4370-a975-ec56de40bb52	214500	t	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:34:59.975722	2026-01-02 12:34:59.975722	withdrawal-osko payment 1633587 mr top group pty ltd huy	supplies	49d82bb9-f339-4450-99b5-43e108cdd20e	\N	\N	\N
b6ffec1a-9e7b-4f2b-92e8-562d6f66042f	1ec07c86-029c-4897-ba8a-c1401e1540fb	18200	t	refunded	\N	\N	2026-01-02 12:34:59.979647	2026-01-02 12:34:59.979647	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
a52e6ee8-f203-4022-a811-224e2b107dd0	a1b50adf-b752-43c0-a45e-bdb2640ea5b7	2478	t	budget	food	\N	2026-01-02 12:34:59.982468	2026-01-02 12:34:59.982468	debit card purchase otr kingsford kingsfordsa aus	\N	\N	\N	\N	\N
0bdd1a60-bc71-474f-8012-515fa175e856	66c74ab5-cb0a-4904-82b4-ad554b6b02bb	70000	t	budget	salary	\N	2026-01-02 12:35:00.001155	2026-01-02 12:35:00.001155	withdrawal mobile 1582279 pymt starr part house&workshop ren	\N	\N	\N	\N	\N
0854b95b-4c5c-4dcc-86a6-34e69feeb879	081dbb9b-97f1-47ce-baff-bc1e36551f34	2816	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:35:00.006583	2026-01-02 12:35:00.006583	debit card purchase bunnings group ltd hawthorn eas aus	supplies	d587b9d4-a448-4b66-9928-2491bc937aa2	\N	\N	\N
20779982-ba19-4a27-838f-be2e834fb197	1ecf32e1-f051-4956-ac92-88e1e763d12f	3029	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:35:00.012527	2026-01-02 12:35:00.012527	debit card purchase bunnings group ltd hawthorn eas aus	supplies	87c6b6a9-f124-41d9-8edd-3d4afa2e46c7	\N	\N	\N
37c4ac4b-9c86-49d2-9d45-eb955ff4a596	c11b21c4-fcd9-4a95-87af-a220e699c320	9336	t	refunded	\N	\N	2026-01-02 12:35:00.01709	2026-01-02 12:35:00.01709	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
6bc24bb3-abba-4c64-82f7-6981ecb903fe	134e7792-db2b-4be8-9b20-b637db2a4bb3	20330	t	project	\N	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	2026-01-02 12:34:59.989842	2026-01-02 12:34:59.989842	debit card purchase bunnings group ltd hawthorn eas aus	supplies	b1c5f0e4-efae-4749-ad3a-fff33fc98ff7	\N	f	\N
05db684e-cd3d-40c7-93d7-e5d8167c8f56	bf11a75e-c4f3-40a0-9b16-f73fad8ea82c	28316	t	project	\N	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	2026-01-02 12:34:59.996791	2026-01-02 12:34:59.996791	debit card purchase bunnings group ltd hawthorn eas aus	supplies	3d39c36b-fb9c-49b0-a16c-3214d3859dcf	\N	f	\N
1e9ed517-aae2-4375-be7e-b3db30634298	d9a2003c-59e7-42cc-bfe3-4e901f3346a3	4791	t	budget	consumable	\N	2026-01-02 12:35:00.021063	2026-01-02 12:35:00.021063	debit card purchase dnh*godaddy #3906654318 sydney	\N	\N	\N	\N	\N
d0929017-951c-4a38-b071-fff3e184ed52	20a97916-9cf6-4c44-b513-6edd1988cde2	10939	t	budget	fuel	\N	2026-01-02 12:35:00.024589	2026-01-02 12:35:00.024589	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
10eab20d-dbf1-4743-a767-1af07f7ef015	75305809-842d-442e-956e-ffa24bbeb24b	10400	t	budget	consumable	\N	2026-01-02 12:35:00.028369	2026-01-02 12:35:00.028369	withdrawal mobile 1231976 bpay asic	\N	\N	\N	\N	\N
d84318a1-d777-488c-aee2-9c4359b52eb9	fc4f9dd4-f1b6-4617-80aa-56a14df1017a	8909	t	budget	consumable	\N	2026-01-02 12:35:00.03137	2026-01-02 12:35:00.03137	debit card purchase super cheap aut auburn aus	\N	\N	\N	\N	\N
e76ca00b-e97c-47e8-b178-fe41c123d4f5	687907a2-c2b3-40c7-a597-702b54e996b0	19079	t	budget	subscription	\N	2026-01-02 12:35:00.034689	2026-01-02 12:35:00.034689	debit card purchase ezi*biz cover (no.3) sydney aus	\N	\N	\N	\N	\N
79dc542d-c80f-4c16-8a74-eb626fcf97e9	0e731e59-e38f-4968-a984-d5b5083fa021	535	t	budget	food	\N	2026-01-02 12:35:00.039156	2026-01-02 12:35:00.039156	eftpos debit 0115953 coles 0762 ramsgate 07/10 card	\N	\N	\N	\N	\N
0c7e9632-f273-434f-9296-fcaa8b4e7873	9fbf5575-f366-47a9-b2a6-5a9eedaab8fa	316200	t	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-02 12:35:00.045676	2026-01-02 12:35:00.045676	deposit-osko payment 2932706 srb (nsw) pty ltd balance maroubra nbr 165	payments	18801781-c424-4a38-9994-1ea3086eaaf4	\N	\N	\N
fab7d1ae-7a72-41fe-b087-1fb4f4bbc05e	ca15ce99-d91a-4e89-91b8-3e2a1a159e5a	5018	t	budget	toll	\N	2026-01-02 12:35:00.050598	2026-01-02 12:35:00.050598	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
4f96e112-fa67-4dab-8c87-2114832c0aa2	74945352-5851-46b4-ac4b-500ec9a4c52c	19457	t	refunded	\N	\N	2026-01-02 12:35:00.063249	2026-01-02 12:35:00.063249	debit card refund complete lintels pty annagrove aus	\N	\N	\N	\N	\N
22ac218a-adcc-4d2c-b21f-69316911fc09	91b8a5e5-165d-4fd5-b006-dea7d785f10a	4560	t	budget	consumable	\N	2026-01-02 12:35:00.066924	2026-01-02 12:35:00.066924	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
3c08186a-5f2b-4258-a532-10fa4f590821	0066ad70-2429-4102-99d5-6f95ec1a250b	28460	t	project	\N	39f350e5-58fd-402e-955b-612f29624236	2026-01-02 12:35:00.071613	2026-01-02 12:35:00.071613	debit card purchase syndey central locksmit north willou aus	supplies	79255143-bd65-4c0d-90e1-5b3c22660f37	\N	\N	\N
4eb13df0-d209-4b14-8707-4bb05e44be5f	28cde0ef-efae-4879-9827-484ccee9412b	70000	t	budget	salary	\N	2026-01-02 12:35:00.076383	2026-01-02 12:35:00.076383	withdrawal mobile 1593952 pymt starr part house&workshop ren	\N	\N	\N	\N	\N
4fa85a84-b9f5-43c1-834c-58c25b25c609	59df064c-9f4f-4201-81d5-a5aeddb05370	283630	t	project	\N	0110152b-bd06-466b-9247-36b3b0f779da	2026-01-02 12:35:00.089859	2026-01-02 12:35:00.089859	deposit-osko payment 2603743 andrew batten andrew batten oatley	payments	75c6d351-f9e0-40fb-80c5-ac25f5613e95	\N	\N	\N
eb63e57a-d8ae-41d0-bb98-350f23f741a5	26312505-706e-45f7-9069-fab016bf1701	9793	t	budget	fuel	\N	2026-01-02 12:35:00.094653	2026-01-02 12:35:00.094653	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
b3a68bd4-3db9-4f65-84f7-5370f78144be	c3490054-5c30-44e3-b2ac-57f882817ce4	130000	t	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:35:00.100133	2026-01-02 12:35:00.100133	deposit-osko payment 2814181 quoc tran huy	payments	49190712-a719-4b19-9848-074fff1ae99f	\N	\N	\N
547c321f-b5c7-435f-aeca-31f1acf09cee	86072349-082a-415f-94e2-be7dc7f7b17c	1291	t	project	\N	b6320ca9-8b3a-4451-8118-1b6b0544f986	2026-01-02 12:35:00.104342	2026-01-02 12:35:00.104342	debit card purchase bunnings group ltd hawthorn eas aus	supplies	402f6616-43cd-44c7-8c8b-d193f3fa2bbf	\N	\N	\N
4e364c08-3658-4144-899f-1346bcfb9665	d1b4a8d2-f2e5-4485-921e-d9cf9a4b524d	1355	t	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:35:00.109797	2026-01-02 12:35:00.109797	debit card purchase bunnings group ltd hawthorn eas aus	supplies	1fc54f3a-a505-46a4-9af1-56d8fd9ec1b6	\N	\N	\N
b939f23d-1e6a-44bd-85ea-da780e080f49	df14446d-d0dc-4792-aac9-1f0e7f2a1b7f	2582	t	project	\N	a7edf71d-c062-4f95-9e3c-d8bc8c532983	2026-01-02 12:35:00.115017	2026-01-02 12:35:00.115017	debit card purchase bunnings group ltd hawthorn eas aus	supplies	61cb4c29-6446-4005-876a-903757c8697b	\N	\N	\N
0fa9760d-7219-4408-96f5-75cf1c4c2791	b68008f5-cdee-4a46-9a50-6282e9cac932	3700	t	budget	food	\N	2026-01-02 12:35:00.125014	2026-01-02 12:35:00.125014	debit card purchase 7-eleven 2214 minchinbury aus	\N	\N	\N	\N	\N
227d65cc-8e5a-4c30-874e-8fd7b3814283	dceaab0a-9920-4b97-94fa-c748156e8f6f	275000	t	project	\N	0110152b-bd06-466b-9247-36b3b0f779da	2026-01-02 12:35:00.130074	2026-01-02 12:35:00.130074	withdrawal-osko payment 1068628 mr top group pty ltd andrew batten project 27	supplies	c7f8146d-601a-4b05-8a87-e4059aa67ce5	\N	\N	\N
7bc586ed-475d-4db1-aaba-656044d19dea	6d97d4e3-3ca6-4c4e-b3a1-0f0d8b9cea87	55000	f	project	\N	a7edf71d-c062-4f95-9e3c-d8bc8c532983	2026-01-02 12:35:00.136327	2026-01-02 12:35:00.136327	withdrawa-osko payment 183865 s sapkota	payments	cf0db0d8-4ec4-4877-8a74-be68ce8d1a02	\N	\N	\N
8a952bff-0937-44b7-a4b5-69e1e7af4dfe	cd6c6c6e-d135-48cd-92e7-43c8d29a4f60	4200	t	budget	food	\N	2026-01-02 12:35:00.140203	2026-01-02 12:35:00.140203	eftpos debit 0946052 el jannah randwick randwick	\N	\N	\N	\N	\N
20cb2d92-646e-4ed6-8494-6f4a16421dfe	cb3040c4-da7e-44d1-bafe-93b52ebf96a4	147900	t	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:35:00.147323	2026-01-02 12:35:00.147323	deposit-osko payment 2758432 quoc tran huy	payments	d1ce80f4-8dd4-4d8b-9304-2569672aeb4a	\N	\N	\N
83077f6f-0a2f-4c55-8be1-2397c49e0589	ece17227-66a3-4d5f-acd9-c1705fa1ea6d	2848	t	refund	\N	\N	2026-01-02 12:35:00.152027	2026-01-02 12:35:00.152027	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
3e11b98f-23ee-401f-943a-c3d27a6e7672	5878ea81-894d-4645-b5b4-25eabbe02d31	1745	t	budget	food	\N	2026-01-02 12:35:00.154655	2026-01-02 12:35:00.154655	debit card purchase vezina pl mascot aus	\N	\N	\N	\N	\N
9c6f5300-aae9-4b6b-afd3-ad8504b26857	bf04bf9c-4da9-49a2-bca7-175a1866c1ae	2848	t	refunded	\N	\N	2026-01-02 12:35:00.157141	2026-01-02 12:35:00.157141	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
c1f32bc1-c0a1-4369-8a01-7b99a0913eec	bce30e73-c4a5-4f16-9b16-4f13954b11fe	3751	t	budget	tool	\N	2026-01-02 12:35:00.159878	2026-01-02 12:35:00.159878	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
5e9d6e10-32d8-49b3-9280-953030a3bd47	71a8051a-181a-4cac-818e-7486529dbcba	5018	t	budget	toll	\N	2026-01-02 12:35:00.163976	2026-01-02 12:35:00.163976	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
49468eea-90d7-45d4-9e48-c4493c01f315	b82a816b-933d-4fee-a1e8-88657b8947af	5018	t	budget	toll	\N	2026-01-02 12:35:00.167037	2026-01-02 12:35:00.167037	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
b2dca5ad-0644-44e3-989c-ce177fce5579	10ebece2-4342-4f43-8596-26f76678e6b7	10000	t	budget	fuel	\N	2026-01-02 12:35:00.171043	2026-01-02 12:35:00.171043	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
023bae4d-54e6-42a5-9e82-3d8814c9c753	eb12532b-0455-4c2c-a241-b5a042a1be70	286000	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.175564	2026-01-02 12:35:00.175564	deposit-osko payment 2751812 quoc tran huy	payments	3819c092-cf30-42b8-a714-145f41acd9ad	\N	\N	\N
d49f0a6e-332c-4d96-ab4a-afab3d4cbaa4	21f726c5-7cd2-4746-81bb-49f936791432	760	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.180992	2026-01-02 12:35:00.180992	debit card purchase bunnings group ltd hawthorn eas aus	supplies	33e355e7-eaad-41df-8a82-a31b96009977	\N	\N	\N
548737dc-7d2c-4785-a6dd-677a506eb43a	f9201007-17af-4d18-b546-dfb175ceaf98	2841	t	budget	tool	\N	2026-01-02 12:35:00.185632	2026-01-02 12:35:00.185632	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
ccf0fb8b-7b7d-44d8-a8c6-49f8a53f9131	a63b229d-f1ac-4538-8b42-e4c80e5ac257	4280	t	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:35:00.189878	2026-01-02 12:35:00.189878	debit card purchase bunnings group ltd hawthorn eas aus	supplies	fb375b46-1ee3-47c7-9a74-13a5621cf9c8	\N	\N	\N
779a9194-763b-4406-abf5-ed2b471abbe6	74656ed3-15a5-4998-8afe-a224b3520620	4800	t	project	\N	d5fb1006-decb-4956-9088-ab2b73b962cf	2026-01-02 12:35:00.194794	2026-01-02 12:35:00.194794	debit card purchase bunnings group ltd hawthorn eas aus	supplies	d3efb468-4a16-4e9a-8d5c-ff3848fdf2da	\N	\N	\N
43ec3dd4-27da-4ff4-a997-121935e181e2	4d0b48d1-1d2f-4f37-a76b-24acc113482b	1872	t	project	\N	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	2026-01-02 12:35:00.200959	2026-01-02 12:35:00.200959	eftpos debit 0269475 munch express minto 15/10 card	supplies	f5c3d18f-01b2-4b0a-b5ca-0071ced18120	\N	\N	\N
445ce4ba-9a09-496e-84b6-a08518ac28ae	1f7f33a0-2621-42f2-84ee-3cee31003ba1	600	t	budget	food	\N	2026-01-02 12:35:00.204897	2026-01-02 12:35:00.204897	debit card purchase speedway west ryde west ryde aus	\N	\N	\N	\N	\N
c47afcc5-feff-48f1-99eb-3a0ef48d6f69	79a8ff81-69aa-481d-959d-63bc2bd2a409	800	t	budget	food	\N	2026-01-02 12:35:00.207858	2026-01-02 12:35:00.207858	debit card purchase speedway west ryde west ryde aus	\N	\N	\N	\N	\N
dbc46e41-f711-41d8-8d53-1b030d27d034	e79bbefb-220e-45f2-b30b-74b79d763493	4003	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.211447	2026-01-02 12:35:00.211447	debit card purchase no 1 roofing & build regents park aus	supplies	c8b3b964-8f78-48f7-9f5a-5ff4960f9c7b	\N	\N	\N
1a08b67b-fdc0-4d6b-811e-7f7ecc9e77f0	6f29dc4a-e138-4285-9042-3e7274b4a7bf	70000	t	budget	salary	\N	2026-01-02 12:35:00.21601	2026-01-02 12:35:00.21601	withdrawal mobile 1581467 pymt starr part house&workshop ren	\N	\N	\N	\N	\N
1af2b158-e517-4370-a90b-887b121f881e	90d556f3-0eaf-42d6-9b2a-9c384bb872fe	379	t	budget	food	\N	2026-01-02 12:35:00.220947	2026-01-02 12:35:00.220947	eftpos debit 0074244 beddy express 1637 ryde north 16/10 ccard	\N	\N	\N	\N	\N
edec4c73-ce39-42c1-a4bc-65cd057da2f6	436a9881-935f-4ebb-9e55-b821da2651ab	55000	t	project	\N	75813c8c-88d2-45e7-b996-ed9181abb268	2026-01-02 12:35:00.225967	2026-01-02 12:35:00.225967	deposit-osko payment 2918144 trent corby 164	payments	cc140b5e-2e75-4c68-a9c0-7f2a177a55ae	\N	\N	\N
1ee0a424-6893-461c-b6d3-d471e4e9d072	8ed0532d-d388-468e-887d-f74362d18d86	21339	t	budget	subscription	\N	2026-01-02 12:35:00.2298	2026-01-02 12:35:00.2298	debit card purchase budget direct toowong aus	\N	\N	\N	\N	\N
2cb1ff2a-c338-44c8-92d4-c182fc920999	a00e1514-0de2-49b6-a2dc-9a8f545c361c	14681	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.233957	2026-01-02 12:35:00.233957	debit card purchase yt aluminium australia milperra aus	supplies	bdbfaad6-437e-4cb4-a96c-07e713dd02ee	\N	\N	\N
48257ddd-7c87-40cf-b431-e9b9cbb9cc3e	c58998bd-496c-4be6-888d-815b9f055d20	7000	t	project	\N	75813c8c-88d2-45e7-b996-ed9181abb268	2026-01-02 12:35:00.237997	2026-01-02 12:35:00.237997	debit card purchase yt aluminium australia milperra aus	supplies	3d4bcc27-2961-4d6f-8881-d47bf39d392b	\N	\N	\N
394caa52-18cd-45a1-a2cb-a442906c2064	08211edf-7ce5-455e-b1ab-a8c160581d26	121000	t	project	\N	b6320ca9-8b3a-4451-8118-1b6b0544f986	2026-01-02 12:35:00.081567	2026-01-02 12:35:00.081567	deposit-osko payment 2371071 tatla civil pty ltd invoice 161	payments	1c994e16-75ba-4796-8a76-9e913cb9e5fc	\N	f	\N
ee9438fb-09cc-4ebc-a1a3-42e5157a773c	a4cde1b2-f97e-417c-a22e-2ec0f83f02e1	143000	t	project	\N	4e96cf11-e67e-42d4-8096-c604e7b041be	2026-01-02 12:35:00.243992	2026-01-02 12:35:00.243992	deposit-osko payment 2830721 skunsh pty ltd acn 106 104 107 aft deposit inv168	payments	ca4c8808-4462-41d2-b533-465dbd7e8c88	\N	\N	\N
21c6f68a-ff51-458c-92b3-4af45adee6da	1fe74551-87be-4f8b-bec8-47b3c8cf8347	533	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.24796	2026-01-02 12:35:00.24796	debit card purchase no 1 roofing & build regents park aus	supplies	d8cfb984-3224-45cb-9bf7-8a78a50105ab	\N	\N	\N
0598e21f-3efa-4345-901f-db77ea234340	ed2d60b3-bec1-417f-b6a4-e22180e3e7a8	3756	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.254601	2026-01-02 12:35:00.254601	debit card purchase no 1 roofing & build regents park aus	supplies	d0f30162-aa23-4dde-884b-b25e244da792	\N	\N	\N
f0ade6bc-e2e2-4672-a83d-b5b1818967b8	00e21bb5-d9dc-4ee9-bc6f-9e59e8ecaaaf	7488	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.2593	2026-01-02 12:35:00.2593	debit card purchase bunnings group ltd hawthorn eas aus	supplies	3cde5a81-449e-4cfe-a1a5-ffd1fd592f1d	\N	\N	\N
d61bd84c-f788-4444-8b5a-4be0745f7b36	1736fe42-d79f-447a-a0e0-e256705cb21f	76890	t	budget	subscription	\N	2026-01-02 12:35:00.263164	2026-01-02 12:35:00.263164	debit card purchase home improvement pages sydney	\N	\N	\N	\N	\N
7cfbe7aa-3cdf-476c-8bbe-2b804b606c9b	cc5357c4-6147-4931-b5a1-02e4790805f4	226600	t	project	\N	76a4a8c5-3e73-47b9-9416-030909165ed7	2026-01-02 12:35:00.268842	2026-01-02 12:35:00.268842	deposit 2961639 bostock g funds transfer	payments	bb6d650b-8ff3-485e-9276-9d54081f9c24	\N	\N	\N
d48167f6-c5a8-4318-aba0-2181bd63d2cb	03fc9368-7389-4b40-b119-28a37fb5da91	9069	t	refund	\N	\N	2026-01-02 12:35:00.273326	2026-01-02 12:35:00.273326	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
572adb13-18fb-4b46-9258-67f29019d99f	68bfbd64-65a5-4716-a33c-eab10f571e00	200	t	budget	food	\N	2026-01-02 12:35:00.276842	2026-01-02 12:35:00.276842	debit card purchase 7-eleven 2269 roseville aus	\N	\N	\N	\N	\N
14d5ffe4-78b9-4d43-b133-a2079a92bbd8	18d5d896-9428-4235-a0aa-106fc2481f4e	12128	t	budget	fuel	\N	2026-01-02 12:35:00.279965	2026-01-02 12:35:00.279965	debit card purchase fairfield petroleum fairfield aus	\N	\N	\N	\N	\N
2cf70ef4-d7ee-42be-bb58-f45f0d85e2f1	8cfd0b5b-60f4-499b-9b0b-c3027e14471f	13547	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.285167	2026-01-02 12:35:00.285167	debit card purchase bunnings group ltd hawthorn eas	supplies	9dae346a-ff01-4ef6-b902-e474e5663426	\N	\N	\N
09b9743e-99ac-4449-9cd6-6af327e2be86	28e7e97e-047b-44b7-9ccc-81074d36690d	11436	t	project	\N	8e3d7051-cec0-42f3-b5f8-0130e93af56f	2026-01-02 12:35:00.28929	2026-01-02 12:35:00.28929	debit card purchase bunnings group ltd hawthorn was aus	supplies	f3f3f953-988b-4e2e-adf1-956fe3979ea8	\N	\N	\N
726251a0-f77d-4ed1-ab0e-32aa24532b07	4d20474f-22c7-4bdd-abb1-34ecf38701d8	9069	t	refunded	\N	\N	2026-01-02 12:35:00.293919	2026-01-02 12:35:00.293919	bunngings refunded	\N	\N	\N	\N	\N
a47768cd-5bde-42bf-a4cc-6dd04634c29c	c34e3d40-59bf-45ad-90ae-23c635ff5e1c	400	t	budget	food	\N	2026-01-02 12:35:00.296836	2026-01-02 12:35:00.296836	debit card purchase speedway west ryde west ryde aus	\N	\N	\N	\N	\N
64c2083e-3482-42f0-bb60-985239b9fa74	0bf5e36f-7711-406a-b4b3-a6bfcf0d6780	70000	t	budget	salary	\N	2026-01-02 12:35:00.301406	2026-01-02 12:35:00.301406	withdrawal mobile 1415545 pymt starr part house&workshop rent	\N	\N	\N	\N	\N
f94fa79e-fd83-4f83-bf49-b47892f539ce	3e6b9ee1-792c-4341-9e22-97d7e51e895b	9002	t	budget	consumable	\N	2026-01-02 12:35:00.304053	2026-01-02 12:35:00.304053	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
7e10f081-6c1b-4230-bf91-4bfb59caffe2	db1630d6-5589-4997-9233-d39db1c7b3b3	283630	t	project	\N	0110152b-bd06-466b-9247-36b3b0f779da	2026-01-02 12:35:00.308876	2026-01-02 12:35:00.308876	deposit-osko payment 2781615 andrew batten andrew #160	payments	a3f765a1-715f-4fd6-8aa5-515a30efee58	\N	\N	\N
cd6041b6-6750-44b0-a454-d46cfed86479	e06a745f-5588-4b2c-a60d-ff64362321cc	2150	t	budget	salary	\N	2026-01-02 12:35:00.314211	2026-01-02 12:35:00.314211	debit card purchase bunnings 586000 south nowra aus	\N	\N	\N	\N	\N
363935b0-03df-483e-939c-64a08b238cfa	f4fc4268-92db-449d-83ad-6b9bdcc2d9c7	60000	f	budget	salary	\N	2026-01-02 12:35:00.324772	2026-01-02 12:35:00.324772	withdrawal-osko payment 1148515 a al-matary salary 26 oct 2025	\N	\N	\N	\N	\N
4e63ca4d-b59b-423e-b641-f81baaf32439	9a3bd82f-4654-497b-8595-5a14e4ec096f	17950	f	budget	salary	\N	2026-01-02 12:35:00.328652	2026-01-02 12:35:00.328652	withdrawal-osko payment 1738111 a al-matari 25 oct 2025	\N	\N	\N	\N	\N
7f46b2d8-71bb-4daf-a23f-214f0f94e692	ff511b26-4834-4c26-bc85-05c3a607636a	238700	t	project	\N	76a4a8c5-3e73-47b9-9416-030909165ed7	2026-01-02 12:35:00.333438	2026-01-02 12:35:00.333438	withdrawal-osko payment 1869214 mr top group pty ltd sean project 31 26 oct 2025	supplies	bae6a346-f812-4f49-abbc-b014836f91a3	\N	\N	\N
4ae4407d-1aaa-4fbf-9868-f091137f4c7e	c0ef4bab-669e-4d26-9cd6-0518e355b362	125000	f	project	\N	f249b0de-1fa6-4027-baa2-89f04b0f24ca	2026-01-02 12:35:00.339636	2026-01-02 12:35:00.339636	deposit-osko payment 262549 ms claudia elizbeth allcroft claudia allcroft	payments	d2b65c17-2019-4afa-b53a-0b675e6796de	\N	\N	\N
29d898c9-ffe3-4b30-a0f1-45f41719f40e	0c109bd2-e546-4b38-ac8d-4e8aece20230	1225	t	budget	food	\N	2026-01-02 12:35:00.343467	2026-01-02 12:35:00.343467	debit card purchase 7-eleven 2269 roseville aus	\N	\N	\N	\N	\N
fd741d97-0077-400c-a166-7a1437d238fe	c0fb1706-d963-40cd-976d-44bf7164cb23	5018	t	budget	toll	\N	2026-01-02 12:35:00.346066	2026-01-02 12:35:00.346066	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
1ff221dd-187a-4dcc-9e36-3ba53ebe936e	99e0f749-8aea-4b34-ab26-4043638a77fe	10000	t	budget	fuel	\N	2026-01-02 12:35:00.349769	2026-01-02 12:35:00.349769	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
cbc9e1fb-0995-4ca1-95e7-29094716c4a8	8fad93e9-d454-4b9b-96a9-dbabcef9b200	192500	t	project	\N	5926aae8-5ce2-4eec-a611-95aba3caaeab	2026-01-02 12:35:00.355226	2026-01-02 12:35:00.355226	deposit-osko payment 2381546 paris esmaeli matanagh quote 302	payments	69e2090e-2728-4ec9-a345-e98243648b04	\N	\N	\N
fda4f4dc-2e5e-4373-848b-a362bf501106	d6b3edc8-5975-4f1d-ab68-e5fcec362786	70000	t	budget	salary	\N	2026-01-02 12:35:00.360827	2026-01-02 12:35:00.360827	withdrawal mobile 1489622 paymt starr part house&workshop rent	\N	\N	\N	\N	\N
33c4b52e-1a35-43ff-b951-d9c46d4ae5f2	c93c2fb6-e9f1-4848-b861-abe0ee0c0e9c	2000	f	budget	tool	\N	2026-01-02 12:35:00.363757	2026-01-02 12:35:00.363757	withdrawal-osko payment 1757904 n ruan balance for macbook air	\N	\N	\N	\N	\N
8d54f96f-09c5-4575-87c3-16f4c0baf053	acfc750d-c056-455e-89e4-f84ad450b455	935	t	project	\N	2461e6fc-ac29-463d-acdf-2a9dcca8607f	2026-01-02 12:35:00.368862	2026-01-02 12:35:00.368862	debit card purchase yt aluminium australia milperra aus	supplies	cbb3ec60-b252-4047-96d6-43ef0bcb4342	\N	\N	\N
402f016c-5a30-4061-9b40-17f31e6069a4	5b1c35ff-92da-46ea-be7d-83d0d1f8e01e	5018	t	budget	toll	\N	2026-01-02 12:35:00.373204	2026-01-02 12:35:00.373204	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
684825bf-b3dd-4281-9cd6-211478b36810	d1a56d91-6dbf-47b4-ba12-fb74693ef574	11596	t	budget	fuel	\N	2026-01-02 12:35:00.376639	2026-01-02 12:35:00.376639	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
c78ffe28-e7d4-4273-b855-ef0b490c95b9	0283753e-f130-4725-813c-f08cf9d60eab	16445	t	project	\N	2461e6fc-ac29-463d-acdf-2a9dcca8607f	2026-01-02 12:35:00.380256	2026-01-02 12:35:00.380256	debit card purchase yt aluminium australia milperra aus	supplies	b294a9b3-0a83-49a0-9828-bbfb342e9c6c	\N	\N	\N
dd42006a-edf7-4066-8a2c-ddae16efe3fa	48d6e5c3-3068-4ae8-ac02-46197eb53276	20031	t	project	\N	2461e6fc-ac29-463d-acdf-2a9dcca8607f	2026-01-02 12:35:00.386871	2026-01-02 12:35:00.386871	debit card purchase yt aluminium australia milperra aus	supplies	33d5f213-cd40-49bf-9b8a-1ccd56224fbd	\N	\N	\N
3910d8af-ebbb-4d17-abaf-2d314bdba8c4	8aa418c0-0c55-48ae-87ac-815018dac7da	26999	t	budget	consumable	\N	2026-01-02 12:35:00.391706	2026-01-02 12:35:00.391706	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
3163e300-f306-496d-9a09-424c04f7f854	d8b15a34-ae83-4496-bbc3-f9399f5d32ab	78100	f	tax	\N	\N	2026-01-02 12:35:00.395828	2026-01-02 12:35:00.395828	debit card purchase ato payment sydney aus	\N	\N	\N	\N	\N
26da11bc-19af-4ddb-be5b-dd2c3e098da5	db33c05a-bfb0-49b8-89b9-c029a8665c58	50600	t	project	\N	4e96cf11-e67e-42d4-8096-c604e7b041be	2026-01-02 12:35:00.400446	2026-01-02 12:35:00.400446	withdrawal-osko payment 1123100 mr top group pty ltd retractable flatscreen	supplies	31d9581c-b0d8-48e8-81f8-b6d3f0f60bca	\N	\N	\N
f4228dc0-b70f-481d-8a24-503d2352241b	bb24d610-7714-4f8c-be44-2beb45592057	80000	f	budget	salary	\N	2026-01-02 12:35:00.404467	2026-01-02 12:35:00.404467	withdrawal-osko payment 1300228 a al-matari salary	\N	\N	\N	\N	\N
d5570a44-6eb2-4d0e-b157-ccbe42481b69	d050fdcc-ff86-4caa-a956-72a9b79248c6	45000	f	project	\N	dcfd3c37-2606-44c1-b09d-c20b854b8a44	2026-01-02 12:35:00.409598	2026-01-02 12:35:00.409598	deposit maxwell grant su max sutherland	payments	b56bfd29-8ae7-4082-b647-4c13769ee8de	\N	\N	\N
49801f2c-0455-4dc3-b576-d30a380476df	35cb3f94-ce9a-49be-8d86-e84b1d2727e3	698	t	budget	food	\N	2026-01-02 12:35:00.413801	2026-01-02 12:35:00.413801	eftpos debit 0076095 sq *oliver brown merrymerrylands	\N	\N	\N	\N	\N
c705b620-fccf-4448-bb71-dac456071911	4dee55c1-45e6-46b0-a49c-f02eb8be61c4	650	t	budget	food	\N	2026-01-02 12:35:00.419058	2026-01-02 12:35:00.419058	debit card purchase speedway roseville roseville aus	\N	\N	\N	\N	\N
d1b5c9bb-5c13-47b0-bee3-8e833fa6fab9	5b546264-38c1-44db-a4d2-f13413c07705	3299	t	budget	subscription	\N	2026-01-02 12:35:00.422431	2026-01-02 12:35:00.422431	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
d50d2a74-61c9-43d4-8feb-254320015ce9	70091eb0-96e3-48e6-b242-9b377a0dbb66	4995	t	budget	consumable	\N	2026-01-02 12:35:00.425608	2026-01-02 12:35:00.425608	debit card purchase jb hi fi merrylands merrylands aus	\N	\N	\N	\N	\N
e8cef60b-c3d8-4b5d-a474-3d4cb85bd0e9	2087a24e-b336-4bd1-a01f-f63238a01579	19079	t	budget	subscription	\N	2026-01-02 12:35:00.428437	2026-01-02 12:35:00.428437	debit card purchase ezi*biz cover (no.3) sydney aus	\N	\N	\N	\N	\N
426ab24b-d9ff-4ff7-a738-757d9c7be109	378bf8f5-8aae-4a5e-80ce-0632c77c3b28	154000	t	project	\N	5926aae8-5ce2-4eec-a611-95aba3caaeab	2026-01-02 12:35:00.431086	2026-01-02 12:35:00.431086	withdrawal-osko payment 1877364 walco aluminium pty ltd safi	supplies	e222178b-fdf6-4085-9f4f-cfe5a8d4230f	\N	\N	\N
5156d497-f3c4-4655-bc23-a98645ff2082	18ed6323-3c02-4cad-8146-1b3e26e376b8	93500	t	project	\N	f249b0de-1fa6-4027-baa2-89f04b0f24ca	2026-01-02 12:35:00.43771	2026-01-02 12:35:00.43771	withdrawal-osko payment 1878185 walco aluminium pty ltd claudia	supplies	feef4ea8-bd30-4b14-8fc2-b1baf0ebee99	\N	\N	\N
886a58f7-48b3-4319-b505-da2c2cf34f4e	56443dba-a4e9-493d-9923-1f1139249ec6	216150	t	project	\N	dcfd3c37-2606-44c1-b09d-c20b854b8a44	2026-01-02 12:35:00.442803	2026-01-02 12:35:00.442803	withdrawal-osko payment 1998187 walco aluminium pty ltd max	supplies	3ee8d72b-e55d-4907-abae-7f229911138a	\N	\N	\N
1d08e51d-363d-4ae5-b30e-efa74fd3ef1f	2d55686d-fc77-4ee3-aae1-209e4d0113a7	184800	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:35:00.450351	2026-01-02 12:35:00.450351	deposit-osko payment 2279549 auzzy projects 170	payments	534c54c7-5fb9-4189-92a0-832b2b76afe9	\N	\N	\N
d5143357-b669-4936-a750-5deec8f5f4f1	e3408a50-2b68-4ab9-9def-c521bae825aa	1797	t	budget	food	\N	2026-01-02 12:35:00.454291	2026-01-02 12:35:00.454291	debit card purchase costco wholesale pty lidcombe aus	\N	\N	\N	\N	\N
48d9a883-a5ce-4b66-8c7f-5500ffa2debd	74dd237c-4b63-4a22-b80c-5e9a10efda0b	80000	f	budget	salary	\N	2026-01-02 12:35:00.457194	2026-01-02 12:35:00.457194	withdrawal-osko payment 1231974 a al-matari salary	\N	\N	\N	\N	\N
8d0043e7-f24c-413b-a541-40f0f613d3ee	55fe598c-d7d4-4a76-a8a4-a2ae70221dae	70000	t	budget	salary	\N	2026-01-02 12:35:00.461274	2026-01-02 12:35:00.461274	withdrawal mobile 1450848 pymt starr part house & workshop rent	\N	\N	\N	\N	\N
0f5c1bb6-fbf9-417e-9947-29eba5f3e1d0	a2e86424-481c-4822-ae8e-f60e3b94422c	65000	f	project	\N	2461e6fc-ac29-463d-acdf-2a9dcca8607f	2026-01-02 12:35:00.46818	2026-01-02 12:35:00.46818	deposit-osko payment 2023463 marisa newham flyscreens for m newham	payments	1bcb57b8-9ad9-402b-8075-2615ab7fc1c4	\N	\N	\N
85da5b1c-54cf-4dfd-81d8-b8e4bb8481cd	123513f9-8f7e-45f5-8719-d1eb033e2425	30000	f	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.480475	2026-01-02 12:35:00.480475	deposit-osko payment 2160925 jack march christine	payments	8984f358-9a77-41db-a05d-c3b167be42ba	\N	\N	\N
e8b5d108-06c8-44ee-876b-d48011f73357	50ff78a9-708d-436c-8b75-b8855673e11b	93500	t	project	\N	37d5a717-f470-43b3-9bbc-4113e9d171e0	2026-01-02 12:35:00.487977	2026-01-02 12:35:00.487977	deposit-osko payment 2545877 rafael defritz nbr 174 - 19 caperbush melonba	payments	73336f0a-0412-465d-998d-855cf7b600e0	\N	\N	\N
c3be33d1-b0b6-4448-8601-da94dd2af3a8	87e85c15-1060-4603-abf4-ce4a13bc1dc9	11571	t	budget	fuel	\N	2026-01-02 12:35:00.492478	2026-01-02 12:35:00.492478	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
6fe1dffd-5ec0-4b4f-9649-19432ada7160	8d5b6644-e9e9-44c2-8b68-a87afdc53222	1760	t	budget	food	\N	2026-01-02 12:35:00.495577	2026-01-02 12:35:00.495577	eftpos debit 0341104 hungry jacks woolloomooloo	\N	\N	\N	\N	\N
88a84078-c38c-4fed-9b7a-2ac928fa131c	f946bb86-3f7c-474a-b9aa-812c89852fe2	2020	t	budget	food	\N	2026-01-02 12:35:00.498068	2026-01-02 12:35:00.498068	eftpos debit 0923302 subway minchinbury 1b colyton ro	\N	\N	\N	\N	\N
299a24ed-7dca-460b-b034-730622829e73	2c496bd1-d92b-4f82-91dd-3b24d705daa6	162250	t	project	\N	b9b032f8-091d-41b3-8064-b2e6673a7609	2026-01-02 12:35:00.504225	2026-01-02 12:35:00.504225	deposit-osko payment 2309139 christopher hole inv 178 deposit	payments	1ca895e8-b57a-4e71-b384-a0d9ec0a0bd0	\N	\N	\N
905e3e45-bfcc-419e-a1f1-a929395c4513	76203c33-0717-4f88-9ff0-07d6a2cf7f30	93500	t	project	\N	005c1242-89c9-4d64-b11d-5d983b4735a8	2026-01-02 12:35:00.509997	2026-01-02 12:35:00.509997	deposit-osko payment 2764068 skunsh pty ltd acn 106 104 107 atf inv179	payments	08497db3-3723-4eeb-9d35-7472aa44e49a	\N	\N	\N
76bb5da2-f31d-411f-b0b6-bbebb7b7f978	380ff467-e311-456b-b2b2-43c6367e27bf	3225	t	budget	food	\N	2026-01-02 12:35:00.519272	2026-01-02 12:35:00.519272	debit card purchase mcdonalds west ryde west ryde aus	\N	\N	\N	\N	\N
a16aebe4-84dd-42ad-846e-52d64e6be73f	4298faa3-2410-4c80-a2b2-6670fecc9e06	5064	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:35:00.523998	2026-01-02 12:35:00.523998	debit card purchase bunnings group ltd hawthorn eas aus	supplies	0c521ded-d300-43a3-8008-5fc894f8bced	\N	\N	\N
d335ecc3-8274-41b3-9583-5e0c393e7ee4	6dc29041-4b03-4f60-a572-1efd2a1f0131	10355	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:35:00.528222	2026-01-02 12:35:00.528222	debit card purchase bunnings group ltd hawthorn eas aus	supplies	fbe1d333-dfc4-4aa5-91e3-cfc7dca21f48	\N	\N	\N
fb02b090-107d-4bac-b917-f8f99b7b0cd7	68572b80-a40f-4db1-87c7-6e50a135afa9	184800	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:35:00.534224	2026-01-02 12:35:00.534224	deposit-osko payment 2791237 auzzy projects 170	payments	1fc3177d-6d71-4762-92ef-9a193d738a13	\N	\N	\N
fb757f38-dd7d-4f57-8310-2977303c1a1a	08bacab2-a404-4809-9e68-75a37cb8a8fd	226600	t	project	\N	76a4a8c5-3e73-47b9-9416-030909165ed7	2026-01-02 12:35:00.541521	2026-01-02 12:35:00.541521	deposit 2097244 bostock g funds transfer	payments	92f7ed54-7603-4384-a842-8c17d077379e	\N	\N	\N
78541fd4-7f48-42d4-8add-bd8f71c59cc0	803b55e6-db1d-4329-a3d3-cb74b4731413	7776	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:35:00.546404	2026-01-02 12:35:00.546404	debit card purchase bunnings group ltd hawthorn eas aus	supplies	f636ef64-c340-4fed-9058-ff4d4e42395e	\N	\N	\N
cbd2c2e7-67e1-44c7-8235-1dbbda647298	bd4b95ee-67fd-40f6-b64a-4f9067bbe75c	100000	f	budget	salary	\N	2026-01-02 12:35:00.554474	2026-01-02 12:35:00.554474	withdrawal-osko payment 1860708 a al-matari salary	\N	\N	\N	\N	\N
134914ef-f681-4cec-8344-86b7f5405519	981d3f3d-0a84-4b8e-b418-4cd530a9d561	70000	t	budget	salary	\N	2026-01-02 12:35:00.557445	2026-01-02 12:35:00.557445	withdrawal mobile 1533880 pymt starr part house & workshop rent	\N	\N	\N	\N	\N
050ca4bd-12c7-4677-81b3-a8b22c469d96	9dabe269-3b74-499f-b294-f4e20d541b04	93500	t	project	\N	005c1242-89c9-4d64-b11d-5d983b4735a8	2026-01-02 12:35:00.561968	2026-01-02 12:35:00.561968	deposit-osko payment 2619919 skunsh pty ltd acn 106 104 107 aft inv179	payments	82a512d1-fed5-47b7-a281-07a9d3876f9d	\N	\N	\N
ec6871ea-03ea-4206-be6b-e80bd786a457	2b300b88-b0d2-4ad6-8cef-497292f46378	50000	f	budget	salary	\N	2026-01-02 12:35:00.565518	2026-01-02 12:35:00.565518	withdrawal-osko payment 1904752 a al-matari salary	\N	\N	\N	\N	\N
b04434b4-23b2-4c41-aec1-6c792b7e1a5f	b763f569-6215-48b9-9c98-d13ecb2e81a9	10000	t	budget	fuel	\N	2026-01-02 12:35:00.569196	2026-01-02 12:35:00.569196	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
4faded84-43ea-4ac7-b8c5-4f751b600421	144dfcb6-1054-4f75-82eb-1c4f4a492626	34925	t	budget	tool	\N	2026-01-02 12:35:00.574219	2026-01-02 12:35:00.574219	debit card pruchase bunnings ltd hawthorn eas aus	\N	\N	\N	\N	\N
0107fd69-0ecb-43c6-bb43-7913413bcaa9	72f6c755-3289-4bb6-bdeb-640380b315e1	76890	t	budget	subscription	\N	2026-01-02 12:35:00.577567	2026-01-02 12:35:00.577567	debit card purchase home improvement pages sydney	\N	\N	\N	\N	\N
8c245be2-28d8-4d0b-8e09-c6af99509574	e3909f53-479a-473a-86a4-4f70b06b32a4	45000	t	project	\N	af77b699-a683-496f-9a9e-61a7dca30b3d	2026-01-02 12:35:00.580881	2026-01-02 12:35:00.580881	withdrawal-osko payment 1505040 mr top group pty ltd fiona window remake measuring issue	supplies	b8c0bc08-6a32-4a58-9f2d-9f6510ec6b71	\N	\N	\N
91a7443b-d9d1-44d1-b47c-538699b04915	d22c7d1c-75a5-47a4-a8bc-81f3739c52f0	6000	t	project	\N	37d5a717-f470-43b3-9bbc-4113e9d171e0	2026-01-02 12:35:00.58549	2026-01-02 12:35:00.58549	withdrawal-osko payment 1563729 mr top group ltd rafael	supplies	f7b3eda1-ecfc-40a9-a6e1-b40316ccd7b6	\N	\N	\N
8eed3ced-4648-48f5-9542-14a3aa5df608	bd7a1180-9ce6-42b7-8d28-0f4352795f42	5500	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.591442	2026-01-02 12:35:00.591442	withdrawal-osko payment 1576640 mr top group pty ltd christine window fly frame	supplies	0bacc14a-66bd-4033-afdb-260ac0dabe34	\N	\N	\N
ab4b3b5d-016c-44d3-9579-0042d53fcf40	1c2573da-4000-4d8b-bbdb-c04a3aac926e	51000	t	project	\N	005c1242-89c9-4d64-b11d-5d983b4735a8	2026-01-02 12:35:00.595802	2026-01-02 12:35:00.595802	withdrawal-osko payment 1583133 mr top group pty ltd retractable paul mckenna	supplies	fc6a3a0e-0cfe-4cf9-8cc3-7961fdd67c9d	\N	\N	\N
a18d352d-0a5d-4c9a-a992-a43c06e52a0c	5a23496c-05c7-4024-80f5-e683e209c271	49500	t	project	\N	b9b032f8-091d-41b3-8064-b2e6673a7609	2026-01-02 12:35:00.600468	2026-01-02 12:35:00.600468	withdrawal-osko payment 1587054 mr stop group pty ltd chris hole bifold hardware	supplies	2b914f8c-6292-469c-9558-c9dfe0166ce7	\N	\N	\N
512565f1-a49b-44bd-bb8d-fbd176bd2d7d	73b2243a-3561-4bd8-a9f5-1c20d1bb92c7	22000	t	project	\N	0110152b-bd06-466b-9247-36b3b0f779da	2026-01-02 12:35:00.606847	2026-01-02 12:35:00.606847	withdrawal-osko payment 1598320 mr top group pty ltd andrew pet door	supplies	9618bb56-882f-4712-9cce-37a10acecfb6	\N	\N	\N
fd594058-e9a0-46f2-8481-3df320e106b5	e7fe2b5b-1b9d-4329-80e3-9dd4e42b6034	21339	t	budget	subscription	\N	2026-01-02 12:35:00.611603	2026-01-02 12:35:00.611603	debit card purchase budget direct toowong aus	\N	\N	\N	\N	\N
ccf0ad62-a48e-4855-bf16-cfcb1bdf3202	f54ce55d-0009-4fe5-aa26-d7d0cf0b0ab7	30800	t	project	\N	37d5a717-f470-43b3-9bbc-4113e9d171e0	2026-01-02 12:35:00.615014	2026-01-02 12:35:00.615014	debit card purchase yt aluminium australia milperra aus	supplies	269f35a5-04a1-43ed-af91-765c3af6f5bc	\N	\N	\N
e375aab6-9315-4ead-aa4b-d0000d5ec03d	e8868ece-70a4-4481-8442-a57c23913f14	192500	t	project	\N	5926aae8-5ce2-4eec-a611-95aba3caaeab	2026-01-02 12:35:00.622168	2026-01-02 12:35:00.622168	deposit-osko payment 2184210 paris esmaeili matanagh quote 302 quote 302 siavash safi	payments	87749d5a-8d9f-488c-9b65-c054481ab977	\N	\N	\N
aa7ebccd-b728-4ecb-b63c-fa40a47fb8d4	61a89755-ca06-4ef6-91bb-6ffbbbfa7b69	250	t	budget	food	\N	2026-01-02 12:35:00.627089	2026-01-02 12:35:00.627089	debit card purchase iga dulwich hill dulwich hill aus	\N	\N	\N	\N	\N
8c8e74a9-cd17-47c9-a413-76aa53fd592b	2fb20dde-e422-4ecf-8235-df13b5108e41	1785	t	project	\N	5926aae8-5ce2-4eec-a611-95aba3caaeab	2026-01-02 12:35:00.63065	2026-01-02 12:35:00.63065	debit card purchase bunnings group ltd hawthorn eas aus	supplies	5340c18f-e5ff-4b69-9f62-6d08baeee764	\N	\N	\N
0a867496-7da0-41e5-993b-d783e275531d	853bcc99-0ffa-4020-bb3a-fa164341e6a5	14155	t	refund	\N	\N	2026-01-02 12:35:00.634782	2026-01-02 12:35:00.634782	deposit-osko payment 2527591 ahmed mohammed al-matari refunc from bunnings purchase be refunded in december	\N	\N	\N	\N	\N
3026fdbe-c94a-4a75-97ac-1c90e1088b65	829c3948-e529-4865-a977-960084da147f	60000	f	project	\N	2f469e47-c8ad-4a4d-a972-b089b6824fab	2026-01-02 12:35:00.641019	2026-01-02 12:35:00.641019	deposit online 2203467 pymt kellie goo deposit goodall	payments	6d6a78fc-f413-4288-9f40-bf558b9508ae	\N	\N	\N
96f8977e-4bb0-4d19-887c-957e98d1595d	0d4443ff-8e7a-482e-ada5-b2a67e4b3e71	1848	t	project	\N	37d5a717-f470-43b3-9bbc-4113e9d171e0	2026-01-02 12:35:00.645256	2026-01-02 12:35:00.645256	debit card purchase yt aluminium australia milperra aus	supplies	ae90d78e-7276-4fe6-8ad3-f625dad3398c	\N	\N	\N
363e628d-b724-4eb4-8b62-375cbdfc0cc9	f891767d-de7f-46df-80a7-062535944e0d	2024	t	project	\N	37d5a717-f470-43b3-9bbc-4113e9d171e0	2026-01-02 12:35:00.648993	2026-01-02 12:35:00.648993	debit card purchase yt aluminium australia milperra aus	supplies	dbb213a2-cb29-495d-b79c-65b71248015e	\N	\N	\N
cbc43117-5027-4044-a6ac-12333329d37b	fd660fb0-92ea-4a30-bfa6-8928b61d7720	3036	t	project	\N	37d5a717-f470-43b3-9bbc-4113e9d171e0	2026-01-02 12:35:00.655064	2026-01-02 12:35:00.655064	debit card purchase yt aluminium australia milperra aus	supplies	df99eb22-4ae3-422e-b44d-1bf2f9602f7b	\N	\N	\N
150b7b21-887d-4323-8f78-3dd223d1a5d9	9478d6ff-a134-4a67-b6be-059ec499c4dd	3850	t	budget	food	\N	2026-01-02 12:35:00.659748	2026-01-02 12:35:00.659748	debit card purchase 7-eleven 2011 guildford we aus card no. ~045253	\N	\N	\N	\N	\N
49ecaa8f-7198-42fd-ae07-47709fa14f0c	a7822c67-a232-4a46-888c-97abd51a669f	10000	t	budget	fuel	\N	2026-01-02 12:35:00.662943	2026-01-02 12:35:00.662943	debit card purchase costco marsden park marsden park aus	\N	\N	\N	\N	\N
5cce633c-5c29-40d6-9ee5-96d3a0179456	b9af6850-30d9-4b83-baff-84e452478a15	14155	t	refunded	\N	\N	2026-01-02 12:35:00.665512	2026-01-02 12:35:00.665512	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
fdb7a462-59b3-4ebd-ac9a-2373b4483e78	f34a3c12-0038-48e9-b562-7b39cfb14c87	3610	t	budget	tool	\N	2026-01-02 12:35:00.668547	2026-01-02 12:35:00.668547	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
abb78952-5343-4714-8e91-c3f45bc86e94	076f671a-7bce-485f-8023-3cf26d559890	38850	t	budget	tool	\N	2026-01-02 12:35:00.672759	2026-01-02 12:35:00.672759	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
911fa676-a4bc-47c9-9023-11e3463b0c60	e24c0164-9422-4d22-8fee-84653b65e5a9	93500	t	project	\N	37d5a717-f470-43b3-9bbc-4113e9d171e0	2026-01-02 12:35:00.678857	2026-01-02 12:35:00.678857	withdrawal osko payment 1542484 shienny andriany refund cancellation raphael	payments	4de8bae3-4347-41f1-b718-f0914d426ab2	\N	\N	\N
4b455c57-bbdd-483f-a45c-9ede2e19fa24	0e02b16d-0bc0-4a6e-9e7a-1fa565582a46	70000	t	budget	salary	\N	2026-01-02 12:35:00.683022	2026-01-02 12:35:00.683022	withdrawal mobile 151894 pymt starr part house&workshop rent	\N	\N	\N	\N	\N
0f1635c1-ce5e-4fc8-bfc8-2089b927d7ac	756a07d4-cfbe-4f27-afbc-10e9ad0990dd	610	t	budget	food	\N	2026-01-02 12:35:00.68896	2026-01-02 12:35:00.68896	debit card purchase bakir sweet secret ice granville aus	\N	\N	\N	\N	\N
f5345813-e168-4bf8-a175-bb62b24e5dfc	1d290e5c-af9b-4a91-93b5-b9e35cf1c17a	1705	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.694354	2026-01-02 12:35:00.694354	debit card purchase bunnings group ltd hawthorn eas aus	supplies	10f8cb5f-1dbd-4117-ae2b-dba8b46e107c	\N	\N	\N
b757c605-0fe5-4847-bc0f-c2e5082ce46a	a3e606ca-42e3-4d37-835c-ab7843a396be	1883	t	budget	food	\N	2026-01-02 12:35:00.698329	2026-01-02 12:35:00.698329	debit card purchase bondi roads seafoods bondi aus	\N	\N	\N	\N	\N
e52d56bd-6728-4f66-b9ba-ce8c999ef1a0	33111bf4-f307-4009-877c-0ed6b43f8812	5018	t	budget	toll	\N	2026-01-02 12:35:00.701531	2026-01-02 12:35:00.701531	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
419b6d1d-30f2-4fbb-bdad-0f5afd97f46a	7339d1b1-515e-4d15-a1ca-e2333de758ea	42008	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.705778	2026-01-02 12:35:00.705778	debit card purchase sydney central locksmi north willou aus	supplies	ded64125-bedc-4a4c-a3fc-20d1f304ae0f	\N	\N	\N
8483c92c-cb2d-4fe4-b70d-dfd998b8d1c4	1eef26c5-3037-4e01-ae14-7da00af3c11d	35000	t	project	\N	2f469e47-c8ad-4a4d-a972-b089b6824fab	2026-01-02 12:35:00.711498	2026-01-02 12:35:00.711498	debit card purchase sydney central locksmi north willou aus	supplies	d631934c-3166-46b3-adbc-e830ddd6a80d	\N	\N	\N
3821b5e2-ffb2-49f6-b0b5-d350cf1d0cab	4718c0d3-2b4b-42be-9b6a-53a5d54840c8	100000	f	budget	salary	\N	2026-01-02 12:35:00.724522	2026-01-02 12:35:00.724522	withdrawal-osko payment 1360230 a al-matari salary	\N	\N	\N	\N	\N
ef0078d2-5ee7-4b11-ac06-dccb18e8ae1c	ffbce84e-2c7a-4095-aa6d-0277c0fc2231	528	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-02 12:35:00.730508	2026-01-02 12:35:00.730508	eftpos debit 0119990 officeworks 0239 old guildford	misc	e7a91aae-d93b-4a36-bed4-7658a5feedc5	\N	\N	\N
9640793d-4308-4ca2-b85a-d3b7ddb25000	d65c914d-b0d7-4994-bdf7-d79ea695c9bb	121000	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:35:00.736486	2026-01-02 12:35:00.736486	deposit-osko payment 2929988 empire constructions sydney pty ltd melrose fron door install	payments	3f59ef93-5940-44e3-959a-346162811780	\N	\N	\N
8dcae55c-ea83-417c-a1b7-e57c9452da78	0bfa756a-e1b1-4229-ba12-b5c84dc97889	998	t	budget	tool	\N	2026-01-02 12:35:00.739967	2026-01-02 12:35:00.739967	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
1d2d108f-9b05-434b-a0b9-3846f9fcc7c0	dab38e85-12ad-41ab-a56c-fc19c5868a73	11885	t	budget	fuel	\N	2026-01-02 12:35:00.743071	2026-01-02 12:35:00.743071	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
c4ac0ba4-4ada-4322-abc9-24ca991b50e1	609a25cb-1a5a-4739-9e06-f6d2507367af	30105	t	budget	salary	\N	2026-01-02 12:35:00.747641	2026-01-02 12:35:00.747641	payment by authority to oz education gui	\N	\N	\N	\N	\N
4ae9f3ba-0213-4120-b45d-61bb9a22dee8	d1c8e390-cd5e-4571-9a44-0210da6c476f	126500	t	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-02 12:35:00.752862	2026-01-02 12:35:00.752862	deposit-osko payment 2605077 auzzy projects	payments	3c53e25d-780e-4adc-8988-83bbb5ad46da	\N	\N	\N
d51add44-93d1-401c-9bbc-eb74ab1da224	bbf470ab-bf62-4eb4-bb3b-b4f537912239	758	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:35:00.757031	2026-01-02 12:35:00.757031	debit card purchase bunnings group ltd hawthorn eas aus	supplies	fdc09a42-7af4-4d8e-8dd2-5dfb490d7915	\N	\N	\N
e0dc563c-49d0-4c24-ad4f-e2ac8aa2f8ea	304edc99-1e5d-478b-9d5d-8ae385875b9f	2052	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:35:00.762606	2026-01-02 12:35:00.762606	debit card purchase bunnings group ltd hawthorn eas aus	supplies	a56c910c-8410-4672-ab2f-caae1f6b04be	\N	\N	\N
06545bbb-27f1-4539-bac3-075b9d3c134f	201264df-6de9-4cd2-b9b8-393209cda911	5872	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:35:00.767377	2026-01-02 12:35:00.767377	debit card purchase bunnings group ltd hawthorn eas aus	supplies	c1712209-abe7-44a6-a040-8f13995a1b38	\N	\N	\N
0a7d82e4-7167-4a9c-b0b4-238478f8a94a	df36e0e8-2880-4abf-8020-69c79f7b939f	126500	t	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-02 12:35:00.77296	2026-01-02 12:35:00.77296	deposit-osko payment 2130442 auzzy projects 186	payments	8d12238f-588b-46a7-a227-e36807eb714e	\N	\N	\N
eac351d8-8a39-4fc4-b3ba-03e112fd2c98	ba8c15fa-c6d7-45b7-918b-1af5e31cbccc	7200	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:35:00.780557	2026-01-02 12:35:00.780557	debit card purchase kennards hire ho nsw 2 seven hills aus	misc	a896d498-e797-4428-b8f9-c1a9c2332866	\N	\N	\N
69154ea5-d2a6-479c-b8e3-3c057f24188c	09d4f3ee-3830-457e-a3c1-2b5eb1f28f1b	141250	t	project	\N	b9b032f8-091d-41b3-8064-b2e6673a7609	2026-01-02 12:35:00.78601	2026-01-02 12:35:00.78601	withdrawal-osko payment 1820470 chris hole refund for bifold hardware repair	payments	66d93590-c71b-4634-86e8-87104043d00b	\N	\N	\N
53eec101-0a0b-4813-b8c6-941bb3dc5a04	629fca95-6add-40bd-b5de-773161a13d8d	70000	t	budget	salary	\N	2026-01-02 12:35:00.789721	2026-01-02 12:35:00.789721	withdrawal mobile 1516605 pymt starr part house&workshop	\N	\N	\N	\N	\N
90434ea3-5f4b-45e5-95ff-ff7e867f2ff6	5ecb5319-8d16-4d66-bbf3-d8e23213a26f	5018	t	budget	toll	\N	2026-01-02 12:35:00.798924	2026-01-02 12:35:00.798924	debit card purchase linkt sydney sydney aus	\N	\N	\N	\N	\N
208d7867-81de-410f-9319-2822e522dfa7	822deae8-3c5a-4e50-a072-ddab07ecb713	6214	f	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-02 12:35:00.802076	2026-01-02 12:35:00.802076	debi card purchase bunnings group ltd hawthorn eas aus	supplies	4cb00a16-9d92-427d-8273-3aac88ab92bc	\N	\N	\N
4391b6c6-0a58-496d-8de1-79bd31076d14	f274781b-7ac7-4c40-baee-f065b34f5dc1	2770	t	budget	food	\N	2026-01-02 12:35:00.806306	2026-01-02 12:35:00.806306	withdrawal-osko payment 1690043 a al-matari good ampol station aussy project ah	\N	\N	\N	\N	\N
97a855c9-0481-4462-8363-7ed6bde8166a	bf321307-eb6c-49e0-8f80-22688f69b28c	350	t	budget	food	\N	2026-01-02 12:35:00.809057	2026-01-02 12:35:00.809057	eftpos debit 0119910 speedway woodpark woodpark	\N	\N	\N	\N	\N
6dd3dcd2-de99-4d9c-aad4-f3baeb2b52c1	bf6cc3e8-1601-4f48-bd51-fdaab61e461a	858000	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-02 12:35:00.820995	2026-01-02 12:35:00.820995	deposit d and s built pt inv	payments	78d8e781-e7c0-4482-8f4f-ab67c805c401	\N	\N	\N
c6f84319-9f2b-4f58-8f06-357edf3825eb	07c61df8-2afb-4260-a7af-3f2e349aab87	835	t	budget	food	\N	2026-01-02 12:35:00.824408	2026-01-02 12:35:00.824408	debit card purchase mcdonalds w/wthville wentworthvil aus	\N	\N	\N	\N	\N
464b4d18-a1fc-4e2a-9c99-1c346bcbdb2d	e27b2b84-a3bf-4056-8ee5-6ebd52105708	1912	t	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-02 12:35:00.82992	2026-01-02 12:35:00.82992	debit card purchase bunnings group ltd hawthorn eas aus	supplies	fbc697ed-8ac9-49d4-8882-2a9ae8255085	\N	\N	\N
09d28ab0-3ac6-40fb-a50a-cc5c742205d8	ddd6a85b-f266-4683-bf5a-42bbf9c5920d	5240	t	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-02 12:35:00.83457	2026-01-02 12:35:00.83457	debit card purchase bunnings group ltd hawthorn eas aus	supplies	02072fed-ca0f-415a-bcf4-c89b0f046ee6	\N	\N	\N
085c465a-dd9d-4984-8add-4f043dcd59f8	ddc89c81-8448-46de-961d-2f53c0e88ddc	12000	t	budget	fuel	\N	2026-01-02 12:35:00.838478	2026-01-02 12:35:00.838478	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
2b86102f-2a85-4844-938d-2fff5e29488c	3f618807-fbe2-453e-8f3a-6719fed07ecc	37224	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.842343	2026-01-02 12:35:00.842343	debit card purchase sydney central locksmi north willou aus	supplies	8343e0f7-3bcc-4239-ab6b-8c46ebbf89b0	\N	\N	\N
39e5b052-321f-4efc-8bf5-68b6b1034935	da8200e6-ba75-4445-9558-98caa7ff3d4a	37296	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.847725	2026-01-02 12:35:00.847725	debit card purchase sydney central locksmi north willou aus	supplies	6629e7e1-285a-4205-abfe-fcc0caefe588	\N	\N	\N
0406cbc5-7017-4ee4-af09-6ce41c71dfae	4ed8f18e-ad58-430e-b98e-2a25a4a27cdf	91595	f	budget	salary	\N	2026-01-02 12:35:00.852125	2026-01-02 12:35:00.852125	withdrawal-osko payment 1084028 a al-matari expenses	\N	\N	\N	\N	\N
4a274a72-0b21-4322-aaf3-12a5deb6e262	7ba995e4-f5d0-4c76-9681-c6c9c7312940	60000	f	budget	salary	\N	2026-01-02 12:35:00.855526	2026-01-02 12:35:00.855526	withdrawal-osko payment 1361314 a al-matari expenses	\N	\N	\N	\N	\N
cd8f975b-d6f3-4d92-81a4-9a74f2841246	d5417f5c-85b7-4c0c-a321-aeba0b086074	50000	f	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.860452	2026-01-02 12:35:00.860452	withdrawal-osko payment 1539756 latasha anthes car repair business meeting tax fed	payments	73c7369a-d4b9-4c0e-9242-67bb4486cb4b	\N	\N	\N
09e7e1cd-14ab-4866-90ee-878fb5141587	554e63c3-bde5-44a5-84f1-812502f23ebc	29491	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.865963	2026-01-02 12:35:00.865963	eftpos debit 0463563 yt aluminium austral iamilperra	supplies	97083eed-2694-4fed-b585-9ed3d8a9727d	\N	\N	\N
4942eeb1-7bfa-4e92-94c3-edf406798ca2	f64cff6f-a9e2-40dc-ae22-c2a66163b468	3080	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.871358	2026-01-02 12:35:00.871358	eftpos debit 0541054 yt aluminium austral iamilperra	supplies	9734392e-863e-4e7f-b8f1-dd2a09178165	\N	\N	\N
5e6ded9b-1a1e-41b3-8b3d-b74e932b1e5e	a6d689dc-4339-4046-89f5-77a0fc22f36c	1350	t	budget	food	\N	2026-01-02 12:35:00.87523	2026-01-02 12:35:00.87523	eftpos debit 0848128 subway minchinbury 1b colyton ro	\N	\N	\N	\N	\N
32895d2f-8129-4760-a138-5e501c8cc3e2	0093ff5d-d251-431e-a45c-d137b7f5ad92	3230	t	budget	consumable	\N	2026-01-02 12:35:00.879302	2026-01-02 12:35:00.879302	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
e8a81f42-783c-4d47-aca7-24b1161b24a5	cbfd9756-804d-422a-9d53-3c6f365640a0	40000	f	budget	salary	\N	2026-01-02 12:35:00.882737	2026-01-02 12:35:00.882737	withdrawal-osko payment 1714299 a al-matari expenses	\N	\N	\N	\N	\N
0789c181-0279-47f5-9bfa-0661c8da2f2e	d6c7935e-f995-407b-b7ea-222a70ad8c2a	53784	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.815341	2026-01-02 12:35:00.815341	debit card refund sydney central locksmi north willou aus	supplies	db1e3613-5119-4544-92b4-ca480d3292f9	\N	f	\N
e803f9b2-5b9b-4afa-81cd-db73e674f6fb	7cf73b51-cc9a-4303-ba91-1b258cc56e42	46750	t	project	\N	005c1242-89c9-4d64-b11d-5d983b4735a8	2026-01-02 12:35:00.887404	2026-01-02 12:35:00.887404	deposit-osko payment 2347083 skunsh pty ltd acn 106 104 107	payments	139443f0-c295-4931-a253-0ca458d3d811	\N	\N	\N
01a4ffac-4d79-44ce-877e-8871a9bd87a0	ae1eb374-87ad-4ac4-ac4e-82979fdd7a76	3299	f	budget	subscription	\N	2026-01-02 12:35:00.891343	2026-01-02 12:35:00.891343	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
e914bab9-c5ed-440a-aef5-3465f9cdafcd	71e9e7c5-7fd6-4ceb-a767-03f26f0a7401	3900	f	budget	food	\N	2026-01-02 12:35:00.896031	2026-01-02 12:35:00.896031	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
c418d138-9278-42be-a540-a8c4b370b747	56860a35-7f84-43d4-9f63-2915bb3a23dc	70000	t	budget	salary	\N	2026-01-02 12:35:00.899216	2026-01-02 12:35:00.899216	withdrawal mobile 1520998 pymt starr part house&workshop ren	\N	\N	\N	\N	\N
7a86f1f5-f26d-480b-a4e7-2424fa6b2bf2	40ae87b6-39c6-4e8a-91cd-fbb140bf1a4e	600	t	budget	food	\N	2026-01-02 12:35:00.920749	2026-01-02 12:35:00.920749	debit card purchase ampol pendle hi 22707f pendle hill aus	\N	\N	\N	\N	\N
669e1b47-07a2-496d-8d93-5b02a9afb0c1	c32ace8f-63de-4be0-9ce1-6467398caec8	676	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.924243	2026-01-02 12:35:00.924243	debit card purchase sydney central locksmi north willou aus	supplies	6e112b93-e981-4c87-b222-203b95bad694	\N	\N	\N
91f49ebc-6be4-460a-a10f-f61e673b6d77	24361afb-1461-4e85-8d61-0bb479af4017	6000	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:35:00.930941	2026-01-02 12:35:00.930941	debit card purchase kennards hire ho nsw 2 seven hills aus	misc	75c0a5e3-b539-48d3-a835-aee5fff2b05a	\N	\N	\N
d34052e2-0f5b-42a2-9db2-a3b499a70421	b179253b-7a3e-4736-9bbe-e2da88fffa59	7056	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.941234	2026-01-02 12:35:00.941234	debit card purchase sydney central locksmi north willou aus	supplies	2e1f7e07-c66e-45a4-ac86-22c5f8be6497	\N	\N	\N
532cfaa4-060c-4aeb-97ba-143c7d659b18	431576a0-e1e7-46c2-9572-0fd008122faa	13258	t	budget	fuel	\N	2026-01-02 12:35:00.945471	2026-01-02 12:35:00.945471	debit card purchase costco auburn lidcombe aus	\N	\N	\N	\N	\N
0f7d8860-88c7-4283-8085-2bc6899fe981	36b11529-155f-4fcb-bea7-b3fe9d07dca2	19079	t	budget	subscription	\N	2026-01-02 12:35:00.94923	2026-01-02 12:35:00.94923	debit card purchase ezi*biz cover (no.3) sydney aus	\N	\N	\N	\N	\N
7fb16386-ef1b-4c8b-aabc-543475dc7dad	90771a01-27ab-4781-93fb-dc42043c3805	1000000	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-02 12:35:00.953476	2026-01-02 12:35:00.953476	withdrawal-osko payment 1598608 mr top group pty ltd deposit for the job 12 saunders rd	supplies	3ef24b63-7a55-4646-97be-c53ca260c9e7	\N	\N	\N
5384674b-e4fd-4541-a2dc-eee222ea30f5	c70462a5-6188-45a1-a3a2-98bcc1394d17	17609	t	budget	salary	\N	2026-01-02 12:35:00.957008	2026-01-02 12:35:00.957008	eftpos debit 0186823 sq *yemen gate resta urlakemba	\N	\N	\N	\N	\N
5f410b11-4417-4e92-9dc0-32d5c7a8c246	b3a332db-650a-4c85-8d97-febd945594c3	2350	t	budget	food	\N	2026-01-02 12:35:00.960886	2026-01-02 12:35:00.960886	debit card purchase ampol lilli 22453f lilli pilli aus	\N	\N	\N	\N	\N
3af18d46-0123-4a68-bb3c-0e4b543b8df7	2fe7e722-2745-4f6e-8cdc-27a20bf0b187	3958	t	budget	tool	\N	2026-01-02 12:35:00.963666	2026-01-02 12:35:00.963666	debit card purchase big w online bellavista aus	\N	\N	\N	\N	\N
15552788-290d-44f8-acf1-235236bf3d4d	a8507827-f7df-40f0-8215-9672d879e774	11959	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-02 12:35:00.968548	2026-01-02 12:35:00.968548	debit card purchase bunnings group ltd hawthorn eas aus	supplies	0e46d911-b246-47c1-b9ad-5084b21934da	\N	\N	\N
1e33c7ba-5c91-4cb4-8aa6-cfc012020e17	4041c3df-8239-465a-9da8-976dbfcbf168	50000	f	budget	salary	\N	2026-01-02 12:35:00.971996	2026-01-02 12:35:00.971996	withdrawal-osko payment 1743563 a al-matari expenses	\N	\N	\N	\N	\N
93ee59fe-651c-49ad-ae39-28cc72d9463d	8d47d2aa-2c40-4191-befd-e5a8f58f3eda	700	t	budget	food	\N	2026-01-02 12:35:00.983096	2026-01-02 12:35:00.983096	debit card purchase 7-eleven 2171 south hurstv aus	\N	\N	\N	\N	\N
77d87b9d-567d-4350-9ebf-a709d131838d	d26d8df4-d145-4148-bded-e3af647ad7bf	2299	t	budget	salary	\N	2026-01-02 12:35:00.986212	2026-01-02 12:35:00.986212	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
2fa626d4-99a8-4643-887a-450958672bd7	255c0efc-5c5d-4412-9384-5f8ddda101f7	5947	f	budget	consumable	\N	2026-01-02 12:35:00.988881	2026-01-02 12:35:00.988881	debit card purchase bunnings 548000 smithfield aus	\N	\N	\N	\N	\N
d12bb5ab-2bdf-43ce-933b-4f46e7564c41	1f7159b3-d5a9-4ef9-9a9b-643b6103f4ea	43605	t	refunded	\N	\N	2026-01-02 12:35:00.991556	2026-01-02 12:35:00.991556	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
d5bf6152-8edf-415a-82d1-77a48fb9f009	ed93e5ac-c379-4c99-bf11-8148a6173b50	9792	t	budget	consumable	\N	2026-01-02 12:35:00.994664	2026-01-02 12:35:00.994664	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
04e0f234-f4d4-46bb-92bd-05cf56f809ff	939c254d-b0d9-41cc-aef4-b1a20b8b3495	72105	t	budget	salary	\N	2026-01-02 12:35:00.997092	2026-01-02 12:35:00.997092	payment by authority to oz education gui	\N	\N	\N	\N	\N
418600ec-4241-45da-92f3-845b8fdb7c2f	5a6b7aea-a26b-4873-82a7-59f4e4caba9b	137500	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-02 12:35:01.003829	2026-01-02 12:35:01.003829	deposit-osko payment 2011869 auzzy projects	payments	f32b29f0-2ffe-4fae-b086-87791a066c75	\N	\N	\N
95419c64-76d3-4d93-8d44-438f2ce81615	09ac3a77-5eca-42c3-abf1-ca81611c5316	43605	t	refund	\N	\N	2026-01-02 12:35:01.007994	2026-01-02 12:35:01.007994	debit card refund bunnings group ltd hawthorn eas aus 	\N	\N	\N	\N	\N
2392c71a-8f5f-49d2-9ff1-ba57db6f1e06	f1c2c040-e52c-4379-97f6-10fb90959a32	2328	t	budget	tool	\N	2026-01-02 12:35:01.011123	2026-01-02 12:35:01.011123	debit card purchase bunnings group ltd hawthorn eas aus	\N	\N	\N	\N	\N
5d216ef1-9a3b-41a7-8a79-9ad8e57b3b39	e31ee744-6259-4b7d-bcab-655191ae6c27	836	t	budget	food	\N	2026-01-02 12:35:01.014148	2026-01-02 12:35:01.014148	eftpos debit 0923089 aldi stores 0404 miranda	\N	\N	\N	\N	\N
2068f550-f162-4030-b2af-c3ce79c7bec9	99b7fe9d-95cf-470c-ad9d-bfd1bd877618	3650	t	budget	food	\N	2026-01-02 12:35:01.018469	2026-01-02 12:35:01.018469	debit card purchase sulai fast food pty lt miranda aus	\N	\N	\N	\N	\N
3723ad26-be96-4038-bd73-7385fb1bef03	1b4d961c-4b53-41b2-a32e-e4eef2872920	5900	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-02 12:35:01.022463	2026-01-02 12:35:01.022463	debit card purchase kennards hire ho nsw 2 seven hills aus	misc	e706d936-2029-40f6-8182-8d86ebe15dd2	\N	\N	\N
aa2fd9f7-5101-40d7-8c5f-8c44d690fcf2	b826c834-d282-4906-9900-180c25ec4a50	70000	t	budget	salary	\N	2026-01-02 12:35:01.026653	2026-01-02 12:35:01.026653	withdrawal mobile 1572517 pymt starr part house&workshop rent	\N	\N	\N	\N	\N
f3061c4e-c183-4d29-a124-a4238b3f65bf	d1319b0a-b0b5-4adf-ab37-e8b613dafe56	12435	t	budget	fuel	\N	2026-01-02 12:35:01.030201	2026-01-02 12:35:01.030201	eftpos debit 0126379 speedway woodpark woodpark	\N	\N	\N	\N	\N
1f3e6b35-0a31-4617-b3ca-3c41f4404973	a94c8473-985f-41dc-8751-14ece86168c7	50000	f	loan	\N	\N	2026-01-02 13:18:44.659979	2026-01-02 13:18:44.659979	deposit-osko payment 2182997 ahmed mohammed al-matari cash withdrawals removals removalist	\N	\N	70a70232-40ca-4e74-ae19-64497417cf7a	t	1e4e62d9-dccb-49a7-8d63-38032134ea5b
a69a214d-de67-4782-ae7f-6b0c9e81f535	953e65fc-f254-464e-9010-337a9583e11f	1599	f	loan	\N	\N	2026-01-02 13:17:43.043463	2026-01-02 13:17:43.043463	debit card purchase apple.com/bill sydney aus	\N	\N	ddb9733e-826f-4be7-a5c0-a0c77f04fbf3	\N	\N
6560e0d7-56c9-4f86-9371-e4234568de47	241330ad-279c-4854-bdd7-2f2bea0c6e58	50000	f	loan	\N	\N	2026-01-02 13:16:38.735316	2026-01-02 13:16:38.735316	withdrawal-osko payment 1996590 ziad abdulhabeeb personal refund in 4 weeks	\N	\N	127b223e-ee04-45b8-9160-c4ea5eda992f	\N	\N
bee4cb84-66f0-4467-86e5-0db2ff327432	58307ff6-4b25-4408-951c-25a47c4fd8bf	50000	f	loan	\N	\N	2026-01-02 13:19:50.361731	2026-01-02 13:19:50.361731	withdrawal at bblsatm guildford 20212214022103 240825	\N	\N	70a70232-40ca-4e74-ae19-64497417cf7a	\N	\N
9f2158ae-19f3-4528-abb0-bd475c1e9f0d	17256d55-43f1-4727-9f8d-d16224cced27	420000	f	loan	\N	\N	2026-01-02 13:20:00.967932	2026-01-02 13:20:00.967932	withdrawal-osko payment 1020702 a al-matari	\N	\N	990e0301-902f-43ce-b608-5012d233d136	\N	\N
5f622ed6-4daa-4e15-8827-a95bb0d7bbf4	029d0087-52de-4072-8495-e7eb7511b999	20000	f	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-02 12:35:00.794	2026-01-02 12:35:00.794	withdrawal-osko payment 1328609 a al-matari cash account	labors	f3be241e-f513-4278-a12a-9f4690647ce7	\N	f	\N
c257a100-f568-4272-b54c-dfbe48f76f07	06bb3b2d-6532-48b8-952c-0134430eb27d	15670	f	loan	\N	\N	2026-01-02 13:18:26.67237	2026-01-02 13:18:26.67237	deposit-osko payment 2800431 ahmed mohammed al-matari load	\N	\N	01820c2e-8372-4454-acc4-567e528a1928	t	b7e95ed8-1191-4eb9-abdb-b5c60c79ac9c
fb4300bc-ea70-4998-943a-ad08645f9a6a	305b9d0d-8c63-4606-a3e6-31dfa8af8ce1	52250	t	project	\N	42681f0f-6c97-4d1a-ab16-afc072737570	2026-01-02 12:34:59.205588	2026-01-02 12:34:59.205588	deposit 000143	payments	c5de5d00-aaa7-4da2-9444-064fc46de6ac	\N	f	\N
e39dd069-00b5-4653-a8ea-9718ae7b567d	3bd8173c-f170-4fb6-983d-9ba81bbe6509	92950	t	project	\N	c54b137c-8ed7-425c-a408-80272ba1c953	2026-01-02 12:34:58.630359	2026-01-02 12:34:58.630359	deposit 2967078 mark mc lean 13 johnson st mascot 13 johnson st mascot	payments	eb6a9316-b92b-4e2a-94f6-ed3c81a52d07	\N	f	\N
32e65340-e65f-473a-a752-f2fa256f72ab	b0d782ad-9430-4ea7-8071-548e5652056e	20000	t	project	\N	c54b137c-8ed7-425c-a408-80272ba1c953	2026-01-02 12:34:58.442195	2026-01-02 12:34:58.442195	withdrawal-osko payment 1662326 norman glazing	supplies	d855a575-b609-447a-a837-4c15fe6e205b	\N	f	\N
eb29fb65-81e3-42a5-8c17-12acd603d498	f84ace64-4663-470c-a676-c19d8db12e66	66500	t	project	\N	49cd8378-4481-4c2d-9e9e-268241211306	2026-01-02 12:34:58.587646	2026-01-02 12:34:58.587646	deposit-osko payment 2111165 mr bradley marc berman 129 129	payments	37abd564-aab3-4224-85bf-4235ed61e857	\N	f	\N
31ef2f8c-a4c4-4071-a05e-9f4fcfcc48d9	34271ca3-a746-4bc5-827c-9a0e3184dcbb	947	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-02 12:35:00.978143	2026-01-02 12:35:00.978143	debit card refund bunnings group 423000 bankswtown aus	supplies	de77d0e7-afbb-44a7-86ae-aee04e164ca6	\N	f	\N
3211806c-ed70-4387-b24f-0002caeade40	a6bb660d-d0ca-4609-b821-2c0ccbe5af0e	34550	t	project	\N	7b4689a1-e4cd-479a-bab9-802def112c4e	2026-01-02 12:34:58.860987	2026-01-02 12:34:58.860987	deposit-osko payment 2572697 kevin berry kevin berry	payments	6e7a131e-331c-4434-904a-6ee203679d43	\N	f	\N
ecb5d8f1-bec7-43fd-99b8-5263048d8e07	d82d11df-5ce2-48da-97d2-bb0d6ed699d7	18267	t	project	\N	7b4689a1-e4cd-479a-bab9-802def112c4e	2026-01-02 12:34:58.867225	2026-01-02 12:34:58.867225	withdrawal mobile 6424401 bpay alspec	supplies	4814b571-caef-461a-a5f6-f58f9818e38f	\N	f	\N
7e3dab71-a72e-46c8-8e06-3bc8f8de8150	d35d1d09-6f38-436b-bdd9-67a35f1bf057	40000	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-02 12:34:59.470942	2026-01-02 12:34:59.470942	withdrawal at stg atm merrylandnsw atm00538075203	labors	99832512-bffd-45be-91bf-59ef8fa57f39	\N	f	\N
9af952bf-060d-4d7b-b132-c40a442fc22b	6ff7a060-8f60-4981-b56e-a96c3edc7556	20000	t	project	\N	70834d5a-77e2-46bb-aaad-6878642480db	2026-01-04 18:34:55.862672	2026-01-04 18:34:55.862672	Ahmed labor	labors	7e20483a-b5ee-410c-90f3-718b4c5bd59f	\N	\N	\N
c23dc69d-646d-4d73-b399-813f6e5c5064	28f4369b-92db-432f-93ed-a83a987dd11d	80000	f	project	\N	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	2026-01-04 18:47:23.766728	2026-01-04 18:47:23.766728	Labour	labors	8a5b1f58-c318-4af1-81be-25b33489f6ee	\N	\N	\N
6a1fe027-425a-40a3-b888-fe2e8a3b01e7	ae91b417-f1fa-48a3-ba3f-9e1579ea4dba	20000	f	project	\N	2c4ff727-51a4-4814-b167-ede3ea556e77	2026-01-04 18:51:25.067915	2026-01-04 18:51:25.067915	Labour	labors	08f847d2-4e60-44c3-81d8-25494232757f	\N	\N	\N
290c854b-69b2-4d99-b4ed-6c07fd972c27	13959d5c-cf55-4ff3-a976-50cc447170eb	110000	t	project	\N	35e96736-2752-4b0d-a07e-c25dc5b3c572	2026-01-04 19:07:24.426931	2026-01-04 19:07:24.426931	Bifold window	payments	627fd0f4-7247-467a-af78-0ba5e2092261	\N	\N	\N
ac3262f4-70cb-42cb-b43a-f248a926d604	6aeb7fbb-5b62-4a54-9189-63f3774dc961	60500	t	project	\N	1d8af109-85f2-4ab0-8f4c-b5717cf8e0f8	2026-01-02 12:34:59.884601	2026-01-02 12:34:59.884601	withdrawal-osko payment 1583388 frank project cancellation	payments	901e3059-1b2f-46a9-9fb5-37c525b05f6f	\N	f	\N
1afa8e2a-8484-4c78-ab0b-b6a459c88715	9b85abdf-af97-4798-b3e3-e9882ae2c60c	24883	t	project	\N	a7edf71d-c062-4f95-9e3c-d8bc8c532983	2026-01-02 12:35:00.058255	2026-01-02 12:35:00.058255	withdrawal-osko payment 1956433 a&a flashing	supplies	8e2b9ec4-873a-4457-8774-73fee84108b7	\N	f	\N
0ba82318-ff55-42d7-b815-9c0fbe6b33b8	fa6f4298-cb91-48dd-bae3-a4c3d39018c3	143000	t	project	\N	4e96cf11-e67e-42d4-8096-c604e7b041be	2026-01-02 12:35:00.474845	2026-01-02 12:35:00.474845	deposit-osko payment 2018763 skunsh pty ltd acn 106 104 107 atf blind terry hills inv168	payments	9b85adf6-d2a7-4ffe-aaa7-301395ca78b2	\N	f	\N
7e245cd9-a46f-4051-90e6-ed348afb4244	bbaf676e-f1a2-4ef0-b656-ffcd5de89721	45000	f	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-05 03:51:30.784012	2026-01-05 03:51:30.784012	Ziad labor	labors	b0e44ec3-aace-459b-9e2a-3ace6b61df76	\N	\N	\N
1ef2578b-d60f-4beb-8b2b-7c2bd926660c	1cda14d9-497e-4eca-a793-a86bcbfa6e8c	6272	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-02 12:35:00.93748	2026-01-02 12:35:00.93748	debit card purchase sydney central locksmi north willou aus	supplies	c417cc52-7e42-48ea-915d-255ecfc98fd3	\N	f	\N
4aef1d84-1e12-4211-9f05-d822ce1edc01	3ccee23f-3ec6-4f62-9c16-31b5d7e2d91a	6272	t	project	\N	9ba263d4-9d99-404b-9f47-109fc4fa4296	2026-01-05 03:59:27.771426	2026-01-05 03:59:27.771426	debit card refund sydney central locksmi north willou aus	supplies	6d5cc9d8-7584-430e-b4a5-0d959ec7035e	\N	\N	\N
9cfe9f2b-0730-42a4-b4d5-94be0b38a94f	9054f63b-0cae-4d23-bea5-20df0d3fbedc	1400	t	project	\N	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	2026-01-05 04:03:34.742091	2026-01-05 04:03:34.742091	debit card refund kennards hire ho nsw 1 seven hills aus	misc	19eb487c-cc6b-47c7-a19c-8ea5d7cd0f7b	\N	\N	\N
39ffef28-c495-4cde-b886-de04f9aae1ad	d07343f1-9031-5ad4-a21d-946b57c276d7	1599	t	budget	salary	\N	2026-01-21 08:52:38.016837	2026-01-21 08:52:38.016837	debit card purchase apple.com/bill sydney aus	\N	\N	\N	\N	\N
697dec33-b1be-4ad0-8609-ce108037de74	cdb73bc9-6080-5b03-bd69-87a0aaab9029	8550	f	budget	consumable	\N	2026-01-21 08:52:48.846488	2026-01-21 08:52:48.846488	debit card purchase kmart 1399 merrylands aus	\N	\N	\N	\N	\N
4ae3b2d3-11ae-406a-8f82-c7ba24f7dc58	82b98c39-b92f-59f4-b829-47f70678273e	2930	t	budget	tool	\N	2026-01-25 00:51:14.344258	2026-01-25 00:51:14.344258	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
d7c15409-c473-4f5f-99c7-7eef02bde3d9	82b98c39-b92f-59f4-b829-47f70678273e	1842	t	budget	salary	\N	2026-01-25 00:52:22.585099	2026-01-25 00:52:22.585099	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
46cbbbcf-b288-4f95-8e04-47b073f2bd7d	9bf0628a-90e4-555f-a47f-030ef7dafc89	4015	t	budget	food	\N	2026-01-25 00:52:47.234458	2026-01-25 00:52:47.234458	DEBIT CARD PURCHASE KFC Mt Druitt Mall     Mt Druitt Ma AUS Card No. ~054253	\N	\N	\N	\N	\N
197814ab-a422-4e95-8563-5c07538addee	1c7b4fc0-c117-59fc-9780-666e103a1ea5	108900	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-25 00:54:24.385579	2026-01-25 00:54:24.385579	DEPOSIT-OSKO PAYMENT 2194791 Auzzy Projects Invoice #190	payments	b867eec1-bd54-482c-83ed-bd087dd33bdd	\N	\N	\N
0823aea5-10cb-4ebb-942a-95860e24d9ea	4744fd1f-8b39-53d2-8c36-4b21cf358a69	13205	t	budget	tool	\N	2026-01-25 00:55:15.033746	2026-01-25 00:55:15.033746	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
05232422-6d5a-46f7-830b-a2857b15fd9a	4744fd1f-8b39-53d2-8c36-4b21cf358a69	43200	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-25 00:58:32.739119	2026-01-25 00:58:32.739119	Filler expanding foam	supplies	f83d38d4-e8f7-4087-95ed-c99ae982af2e	\N	\N	\N
34704f72-cfdb-4011-b54f-339b38085a23	4744fd1f-8b39-53d2-8c36-4b21cf358a69	1311	t	project	\N	e8c28b1b-e446-40b6-8a36-2d7934e193b4	2026-01-25 00:59:14.398537	2026-01-25 00:59:14.398537	Masking tape	supplies	f996c6ee-6095-40be-b829-8a91946ce7b3	\N	\N	\N
0453991e-f0d3-41ef-873c-e763247c497e	5f16f9a6-e1bc-5ec3-8f93-ed7dd18db52d	5940	t	budget	consumable	\N	2026-01-25 00:59:49.754211	2026-01-25 00:59:49.754211	DEBIT CARD PURCHASE DNH*GODADDY#3971146187 SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
2b6820b0-b8a3-4aaf-92d3-c6494605b87c	f07d72ea-3b99-5a92-988d-9c86fb2b460e	5018	t	budget	toll	\N	2026-01-25 01:00:00.72473	2026-01-25 01:00:00.72473	DEBIT CARD PURCHASE LINKT SYDNEY SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
b4b1f0cc-0a81-460f-8133-4044e711579b	6289852e-2d3d-57d2-a41f-6df4f6a71eee	22800	t	budget	tool	\N	2026-01-25 01:00:18.387058	2026-01-25 01:00:18.387058	EFTPOS DEBIT 0127186 Sydney Tools Silverwater   17/12 Card No. ~054253	\N	\N	\N	\N	\N
bff30bb6-340e-4a53-9a99-d13fcf8ec4fc	459d4a84-dd75-5b6e-a779-8e7bbb112524	76890	t	budget	subscription	\N	2026-01-25 01:00:27.606444	2026-01-25 01:00:27.606444	DEBIT CARD PURCHASE hipages tradiecore Sydney       AUS Card No. ~054253	\N	\N	\N	\N	\N
f2ace57e-9d5c-4ac0-bc05-11ac85bc69cf	091cfd35-0221-5796-8a62-bfafe2065dce	2370	t	budget	tool	\N	2026-01-25 01:01:13.23063	2026-01-25 01:01:13.23063	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
bd30f10a-8977-43ef-8695-491d1b008dc2	ec541075-ea3b-5d90-8ca7-21982c64c74d	70000	t	budget	salary	\N	2026-01-25 01:01:23.131342	2026-01-25 01:01:23.131342	WITHDRAWAL MOBILE 1472737 PYMT Starr Part House&Workshop ren	\N	\N	\N	\N	\N
41719b2d-829a-47d5-80b7-47d1d6da321d	cf37aa48-7651-5123-82ed-399d2c06c88c	1500000	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:01:57.558203	2026-01-25 01:01:57.558203	WITHDRAWAL-OSKO PAYMENT 1553970 Mr top Group Pty Ltd 12 Saunders Bay Road South Caringba	supplies	5e82b74e-3206-4a09-bbad-2796c255c6d2	\N	\N	\N
c6518355-dfbf-4460-8257-1732bded7e45	8b64a8eb-2cf0-50de-8d4d-ec103e17c2df	7129	t	budget	fuel	\N	2026-01-25 01:03:20.638417	2026-01-25 01:03:20.638417	DEBIT CARD PURCHASE 7-ELEVEN 2238 SUTHERLAND   AUS Card No. ~054253	\N	\N	\N	\N	\N
8d57d5ed-16bb-44ed-beed-55884713c889	1e3c7899-9db4-59ba-a032-b50f613269d0	4200	t	budget	food	\N	2026-01-25 01:03:30.740743	2026-01-25 01:03:30.740743	EFTPOS DEBIT 0206468 El Jannah Chester Hi l Chester Hill  19/12 Card No. ~054253	\N	\N	\N	\N	\N
b45f2a67-1fb0-4ce0-8006-6f9b900e073d	f7043d6d-b086-5b2f-9964-6ef15346fe9f	5676	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:04:33.86399	2026-01-25 01:04:33.86399	DEBIT CARD PURCHASE YT ALUMINIUM AUSTRALIA MILPERRA     AUS Card No. ~054253	supplies	b06600f2-ecb5-4706-8634-a37636d63dad	\N	\N	\N
653eb80b-0a49-401f-a882-c3f393fd9fbc	ab9a3464-9059-5121-804b-4babfffd6ec5	1934	t	budget	food	\N	2026-01-25 01:04:55.247165	2026-01-25 01:04:55.247165	DEBIT CARD PURCHASE ISSA PIZZA Padstow      AUS Card No. ~054253	\N	\N	\N	\N	\N
63acfeb4-ca3b-4605-9a19-c94cb8412c71	4b4f3d79-3d08-5788-873c-ff3775ec7a1d	509	t	budget	food	\N	2026-01-25 01:05:24.508162	2026-01-25 01:05:24.508162	DEBIT CARD PURCHASE ISSA PIZZA Padstow      AUS Card No. ~054253	\N	\N	\N	\N	\N
8ab1a66b-c4a8-4e7d-9b6f-2b8f63436ab6	bc6d9b0b-e91a-5316-982b-1be1d097b448	3003000	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:06:01.755684	2026-01-25 01:06:01.755684	DEPOSIT D AND S BUILT PT        SaundersBay INV192	payments	6211577a-b89f-43aa-b853-881f1f863767	\N	\N	\N
081f67b2-ac58-40a8-9958-8e277a9496d2	7cfc2195-95c2-59e1-aeb2-675a9f4c90e3	1800	t	budget	food	\N	2026-01-25 01:06:17.263692	2026-01-25 01:06:17.263692	DEBIT CARD PURCHASE WOOLWORTHS      1145 FAIRFIELD    AUS Card No. ~054253	\N	\N	\N	\N	\N
d051986f-9d19-43f1-9dc5-dadcdbb32e05	8ed02b00-8848-5878-95d6-3dd5c23c4aa5	220000	f	budget	salary	\N	2026-01-25 01:06:29.496473	2026-01-25 01:06:29.496473	WITHDRAWAL-OSKO PAYMENT 1104459 A AL-MATARI	\N	\N	\N	\N	\N
b1e4d96c-531c-472c-b66a-d0ae9cafe653	40518606-dc0f-5405-87bc-fe4d583e2a4b	916	t	budget	food	\N	2026-01-25 01:07:04.386395	2026-01-25 01:07:04.386395	DEBIT CARD PURCHASE ABUSALIMG      L1036 GUILDFORD    AUS Card No. ~054253	\N	\N	\N	\N	\N
0bdae99c-0ef0-4064-9194-80fe8112623f	13425715-0e90-5d31-8ce6-d4accf653eb4	4048	t	budget	salary	\N	2026-01-25 01:08:08.858955	2026-01-25 01:08:08.858955	EFTPOS DEBIT 0562308 DJM GOBRAN SERVICES PTFAIRFIELD     21/12 Card No. ~054253	\N	\N	\N	\N	\N
280598db-624f-46a3-8944-69e7ea6d7257	5e4edbde-c1d1-5fe5-a8d6-f1b434b7c59e	967	t	budget	salary	\N	2026-01-25 01:08:29.587207	2026-01-25 01:08:29.587207	DEBIT CARD PURCHASE NOUR FRESH PRODUCE PTY GUILDFORD    AUS Card No. ~054253	\N	\N	\N	\N	\N
8ebdb55e-71cb-4ded-a307-65c056c5d3d2	6c8ae65b-86a0-50b9-bccf-d7501b1df2f7	33155	t	budget	tool	\N	2026-01-25 01:09:23.266464	2026-01-25 01:09:23.266464	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
f21213eb-4bad-4f02-a292-463610547a36	6c8ae65b-86a0-50b9-bccf-d7501b1df2f7	4880	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:10:10.203575	2026-01-25 01:10:10.203575	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	supplies	afda5a50-9e25-499b-bf5b-6ae267b7e3dd	\N	\N	\N
e879dcdb-8d23-40d5-bd83-586bf804ab56	6c8ae65b-86a0-50b9-bccf-d7501b1df2f7	1366	t	budget	consumable	\N	2026-01-25 01:10:27.651211	2026-01-25 01:10:27.651211	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
d0c21c28-53c1-4fd1-845a-845900298e72	6c8ae65b-86a0-50b9-bccf-d7501b1df2f7	650	t	budget	consumable	\N	2026-01-25 01:10:34.840602	2026-01-25 01:10:34.840602	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
d4bc66e7-d6f7-43b0-9d84-f9c44468ad0a	9f011a25-7ce1-5997-984f-37e51938f1d1	1309	t	budget	food	\N	2026-01-25 01:11:05.433314	2026-01-25 01:11:05.433314	DEBIT CARD PURCHASE ABUSALIMG      L1036 GUILDFORD    AUS Card No. ~054253	\N	\N	\N	\N	\N
43a39623-8bf7-440c-a318-3c8014f745d1	1082e9f4-d96b-5abb-93f8-2e266ddcdb81	38673	t	budget	salary	\N	2026-01-25 01:11:17.433917	2026-01-25 01:11:17.433917	DEBIT CARD PURCHASE COSTCO WHOLESALE PTY LIDCOMBE     AUS Card No. ~054253	\N	\N	\N	\N	\N
f07b606d-82cc-4561-b8d3-bc8e2d5df1d8	16666569-2c9c-5a09-a512-745c5fe83e6c	14608	t	budget	consumable	\N	2026-01-25 01:11:30.689613	2026-01-25 01:11:30.689613	DEBIT CARD PURCHASE SUPER CHEAP AUTO PTY GUILDFORD    AUS Card No. ~054253	\N	\N	\N	\N	\N
dbc7e8c6-07d8-42ab-ac33-42903863acee	bb061042-bc9f-5697-b012-44fe8c2691ef	1518	t	budget	food	\N	2026-01-25 01:11:44.570937	2026-01-25 01:11:44.570937	EFTPOS DEBIT 0260444 SQ *YEMEN GATE RESTA URLakemba       22/12 Card No. ~054253	\N	\N	\N	\N	\N
0ae79265-1c6b-41e3-a24a-b0fff9d2cec5	38b4d651-97f4-5cdf-9a72-2fdd071f9575	10000	t	budget	fuel	\N	2026-01-25 01:11:55.759225	2026-01-25 01:11:55.759225	DEBIT CARD PURCHASE COSTCO AUBURN LIDCOMBE     AUS Card No. ~054253	\N	\N	\N	\N	\N
f0d0cebd-ab32-421d-b893-ee2032fad766	53ce6af2-fddf-5dd7-abaa-6fe893aab3c9	684	t	project	\N	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	2026-01-25 01:12:49.763041	2026-01-25 01:12:49.763041	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	supplies	c4c02c37-b542-4dbb-96d6-6e613fbb64cf	\N	\N	\N
32f6513a-49ca-4a40-8c10-aef627a5c7ab	5805dd70-23d1-58b5-bdf7-d86b2d90a954	40105	f	budget	salary	\N	2026-01-25 01:13:02.537804	2026-01-25 01:13:02.537804	PAYMENT BY AUTHORITY TO Oz Education Gui A00KYB5L05AA	\N	\N	\N	f	\N
d8ffe666-5f0c-4ad0-86ae-160d5c97f460	e2df4bc8-15ab-5b94-8183-ec75516e0cfe	2000	t	budget	tool	\N	2026-01-25 01:13:38.711458	2026-01-25 01:13:38.711458	EFTPOS DEBIT 0142167 SYD TOOLS SMITHFIELD Smithfield    23/12 Card No. ~054253	\N	\N	\N	\N	\N
d530a4d7-238f-489f-a596-40796403fedd	ed230462-f703-59e1-b0a8-234b5b2980de	2230	t	budget	food	\N	2026-01-25 01:13:58.121259	2026-01-25 01:13:58.121259	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	\N	\N	\N	\N	\N
32f6f37c-73ea-4917-ba11-a81c2695a3a6	0a3e3515-f87a-5feb-887b-f15399b28ff3	1326	t	budget	food	\N	2026-01-25 01:14:07.530449	2026-01-25 01:14:07.530449	EFTPOS DEBIT 0441093 SQ *OLIVER BROWN AUB URAuburn        25/12 Card No. ~054253	\N	\N	\N	\N	\N
c2ff9fc6-8b01-4792-9674-2a6534a1f8be	8ffce5cb-bac2-5018-9a0f-bebe0df8d626	70000	t	budget	salary	\N	2026-01-25 01:14:14.472249	2026-01-25 01:14:14.472249	WITHDRAWAL MOBILE 1570414 PYMT Starr Part House&Workshop ren	\N	\N	\N	\N	\N
8b303994-3b09-4bfe-a37b-403526ccdf85	394adefb-8330-5cb9-9de3-5ed2e82fcc01	5695	t	budget	consumable	\N	2026-01-25 01:14:48.442223	2026-01-25 01:14:48.442223	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
0a7fa103-37db-4a6e-95df-24f6be206f45	394adefb-8330-5cb9-9de3-5ed2e82fcc01	1424	t	budget	tool	\N	2026-01-25 01:14:56.501556	2026-01-25 01:14:56.501556	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
7ba55ea3-0410-44d5-83d0-75ebc718803c	ac16a756-8003-550a-8537-570aec1fe68a	10000	f	budget	salary	\N	2026-01-25 01:15:07.843537	2026-01-25 01:15:07.843537	WITHDRAWAL-OSKO PAYMENT 1648483 A AL-MATARI 25 DEC 2025	\N	\N	\N	\N	\N
03c74be9-d1b0-4c33-befd-c7cde79573f6	6a699814-286b-5f80-b671-e3f450902015	50000	f	budget	salary	\N	2026-01-25 01:15:16.660431	2026-01-25 01:15:16.660431	WITHDRAWAL-OSKO PAYMENT 1949917 A AL-MATARI 26 DEC 2025	\N	\N	\N	\N	\N
e222d037-7eab-4973-8d4c-55eb6d7d2496	0c776423-5433-5631-93f4-d433871da05f	5326	f	budget	salary	\N	2026-01-25 01:15:38.08435	2026-01-25 01:15:38.08435	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
d5316d79-4868-4e03-b778-a634c011c630	9af8ec64-5399-5ffb-bcb0-9148a1e8cbf8	10000	f	budget	salary	\N	2026-01-25 01:15:45.958273	2026-01-25 01:15:45.958273	WITHDRAWAL-OSKO PAYMENT 1466181 A AL-MATARI 25 DEC 2025	\N	\N	\N	\N	\N
72c0ed54-2f20-4d7e-97e6-a47c26c305f5	47719a45-ae45-54a9-b3a6-ba6bf6538f10	5130	t	budget	consumable	\N	2026-01-25 01:18:44.950591	2026-01-25 01:18:44.950591	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
e16c485e-a617-4dad-917c-cc26343e368e	47719a45-ae45-54a9-b3a6-ba6bf6538f10	945	t	budget	tool	\N	2026-01-25 01:18:54.261556	2026-01-25 01:18:54.261556	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
c437ef75-7c15-4754-99b6-721e62aa159e	ba4b0f52-476e-5b3e-9d24-f2acace3b6a1	11232	t	budget	fuel	\N	2026-01-25 01:19:07.774596	2026-01-25 01:19:07.774596	EFTPOS DEBIT 0133692 SPEEDWAY WOODPARK WOODPARK      28/12 Card No. ~054253	\N	\N	\N	\N	\N
22151795-eb6f-411a-a25c-e504c1cfa9be	2d02608b-a70b-5851-9caf-5d197cce2e12	20046	t	budget	tool	\N	2026-01-25 01:19:27.338828	2026-01-25 01:19:27.338828	DEBIT CARD PURCHASE BUNNINGS 548000 SMITHFIELD   AUS Card No. ~054253	\N	\N	\N	\N	\N
3d945bb1-3a89-4c79-b733-84f75aacb882	2e47f09e-0408-5e7e-aa92-5bf2b5082eac	7701	f	budget	salary	\N	2026-01-25 01:19:41.945283	2026-01-25 01:19:41.945283	EFTPOS DEBIT 0026237 ZLR*Lindas Discount ChChester Hill  30/12 Card No. ~054253	\N	\N	\N	\N	\N
975a1243-5c63-401e-af2f-57d55ad4f3c0	1df6b3b6-718f-59cc-8a1b-d28d7c649b53	1170	t	budget	food	\N	2026-01-25 01:19:54.39509	2026-01-25 01:19:54.39509	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	\N	\N	\N	\N	\N
f176f908-8caf-4ef9-8b05-2b6b45c4aed2	17eb21c4-c20e-56b5-b63a-54894992c8f9	688	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:20:35.530029	2026-01-25 01:20:35.530029	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	supplies	2c65bda5-f4fb-4f94-881b-a12e44c4f390	\N	\N	\N
343f32c1-30c1-4410-8a23-f9c931624fb4	18296135-e013-5f26-8edd-724ee1723d54	23488	t	refunded	subscription	\N	2026-01-25 01:00:49.650004	2026-01-25 01:00:49.650004	DEBIT CARD PURCHASE BUDGET DIRECT TOOWONG      AUS Card No. ~054253	\N	\N	\N	\N	\N
82c6ee98-169f-4129-a31c-5571e5abad39	e0b77a7b-1811-5fb3-a636-ff9777a07ffb	23488	t	refund	\N	\N	2026-01-25 01:21:16.541698	2026-01-25 01:21:16.541698	DEBIT CARD REFUND BUDGET DIRECT          TOOWONG     AUS Card No. ~054253	\N	\N	\N	\N	\N
ab15aec9-49cc-44d2-bf3b-e9a5c6f1de24	610a1fe1-0bb3-5db8-87c0-d3c36847ccb4	4670	t	budget	consumable	\N	2026-01-25 01:21:43.430563	2026-01-25 01:21:43.430563	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
882fec26-e048-4add-9fac-4d2ad91ea981	e8eece58-f86c-5c04-ba2f-c821a6d6434a	70000	t	budget	salary	\N	2026-01-25 01:21:55.918901	2026-01-25 01:21:55.918901	WITHDRAWAL MOBILE 1430063 PYMT Starr Part House&Workshop ren	\N	\N	\N	\N	\N
974db875-72ce-4200-a4dd-dcc7c6ef8bb0	59d1e5d7-6564-5d7f-ab9e-a64953f52cd4	51000	f	budget	salary	\N	2026-01-25 01:22:06.404913	2026-01-25 01:22:06.404913	WITHDRAWAL-OSKO PAYMENT 1089810 A AL-MATARI	\N	\N	\N	\N	\N
07071d59-0d86-4d79-a6ec-4eb5c6cbf413	19780e9b-8dc2-5442-9560-cb70b77bce91	51000	f	budget	salary	\N	2026-01-25 01:22:13.189062	2026-01-25 01:22:13.189062	WITHDRAWAL-OSKO PAYMENT 1074961 A AL-MATARI	\N	\N	\N	\N	\N
f398d927-ce67-4061-9ad8-b368ac70fcf5	fef9684e-1973-58d0-be04-01833120c00d	135000	f	budget	salary	\N	2026-01-25 01:22:37.447308	2026-01-25 01:22:37.447308	WITHDRAWAL-OSKO PAYMENT 1645941 A AL-MATARI 01 JAN 2026	\N	\N	\N	\N	\N
ca5b4e70-ac97-478b-ae4e-ec19f0ad97f8	e0a9280f-3f45-5ff8-b778-44c0209e1dcc	651	t	budget	tool	\N	2026-01-25 01:23:10.943759	2026-01-25 01:23:10.943759	DEBIT CARD PURCHASE BUNNINGS 548000 SMITHFIELD   AUS Card No. ~054253	\N	\N	\N	\N	\N
0604ff69-a5cc-4f61-a280-f0cb84559f05	75afcfab-42ce-5e0d-96be-8adfe7a8a5cf	200	t	budget	food	\N	2026-01-25 01:23:22.184045	2026-01-25 01:23:22.184045	EFTPOS DEBIT 0246880 Shell Reddy Express LiLiverpool     02/01 Card No. ~054253	\N	\N	\N	\N	\N
fc10893c-d8b1-49bf-a28d-46797518367f	8e185ab9-6c39-5c5a-ab58-67e6a618fc23	85000	t	project	\N	39f350e5-58fd-402e-955b-612f29624236	2026-01-25 01:23:57.489802	2026-01-25 01:23:57.489802	WITHDRAWAL-OSKO PAYMENT 1893875 Kim sammut Refund	payments	a7129596-a2c5-4ac8-abbb-dd4de9350cbf	\N	\N	\N
2958d5dc-8792-4612-8d3b-64d8f19f99dc	977fb18a-8617-534c-ab6c-a5c565b80810	176000	t	project	\N	a6388f4f-02bf-49e0-9b74-d51628ac7b05	2026-01-25 01:28:53.005967	2026-01-25 01:28:53.005967	DEPOSIT 2923649 O'Neill J G & Breese P E Inv#195	payments	b087ea0b-dfa8-42bb-98ad-5e4a9e39b444	\N	\N	\N
59510ef3-4df5-4599-8cb8-038aae451147	ffedd62f-0dd6-5628-af81-ce60423cb49d	3299	t	budget	subscription	\N	2026-01-25 01:29:11.387063	2026-01-25 01:29:11.387063	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
733822e5-fdc4-4eb1-95c6-f9fbb4d4dc42	16df58d9-0a63-5e5b-8fe4-62571040dd02	10000	t	budget	fuel	\N	2026-01-25 01:29:22.353734	2026-01-25 01:29:22.353734	DEBIT CARD PURCHASE COSTCO AUBURN LIDCOMBE     AUS Card No. ~054253	\N	\N	\N	\N	\N
097edcee-d392-4af4-9bfe-798413ae28d2	a1423af7-1883-5f91-aae9-76e8e9b3d4c6	19079	t	refunded	\N	\N	2026-01-25 01:30:30.819649	2026-01-25 01:30:30.819649	DEBIT CARD PURCHASE EZI*BIZ COVER (NO.3) SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
408b6d73-049b-4d43-bb4d-f78b75421113	0c447b59-c323-5b6d-9e0c-1cf7ce2cacea	19079	t	refund	\N	\N	2026-01-25 01:31:00.025101	2026-01-25 01:31:00.025101	DEBIT CARD REFUND EZI*BIZ COVER (NO.3) SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
f2f8b47f-600c-4779-aaff-8d2820bdcaf7	a3451ae9-73c1-583e-bb3f-038ec1c4def6	9634	t	budget	subscription	\N	2026-01-25 01:31:13.45612	2026-01-25 01:31:13.45612	DEBIT CARD PURCHASE EZI*BIZ COVER (NO.3) SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
0b8fbc82-d102-4b54-b9ec-82dc34e39c1a	462bb13f-5542-5aff-9c5c-1e639003c64d	48105	f	budget	salary	\N	2026-01-25 01:31:22.647029	2026-01-25 01:31:22.647029	PAYMENT BY AUTHORITY TO Oz Education Gui A00L170705P9	\N	\N	\N	\N	\N
18d9cb7b-e8d7-42d5-9b3b-40ad43bf4590	7fab5b74-b968-5340-89fc-078563c71b8c	533	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:31:58.051845	2026-01-25 01:31:58.051845	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	supplies	b6426d49-791d-49c6-9acc-7bf6e2ecc1f2	\N	\N	\N
69281d6c-efb6-4f15-8069-76d76b419cff	367da866-26ae-5172-a5f2-04e2c8cea425	2218	t	budget	food	\N	2026-01-25 01:32:26.609069	2026-01-25 01:32:26.609069	EFTPOS DEBIT 0178827 BP EXP GYMEA 0860  \\ GYMEA          06/01 Card No. ~054253	\N	\N	\N	\N	\N
91f7880c-6dda-4361-974b-b800d3ce708c	54a18a63-f9fa-5046-85bb-50e333c4f5f8	3003000	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:32:47.359782	2026-01-25 01:32:47.359782	DEPOSIT D AND S BUILT PT        CaringbahSouth 196	payments	648408e8-40c0-4197-877a-ceeb4b35f465	\N	\N	\N
b9ccd642-40c6-465a-984e-bc1ba2a466ad	8ed28247-6b8d-58a5-9ddc-751507580dbd	235400	t	project	\N	eb21b41a-8be0-4a8e-9880-e5987ca12a44	2026-01-25 01:38:03.032777	2026-01-25 01:38:03.032777	DEPOSIT-OSKO PAYMENT 2030785 MR MATTHEW NAPIER DONNELLY Windows and doors 10  deposit Donnelly project	payments	1365dc91-32c6-4dd3-8e43-37551661a64f	\N	\N	\N
b792d6ee-db61-48a0-991c-cea027751187	436f50c0-79e7-586f-ac6b-f1cef7a1a855	1500000	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:38:32.41289	2026-01-25 01:38:32.41289	WITHDRAWAL-OSKO PAYMENT 1992882 Mr top Group Pty Ltd Third deposit for 12 Saunders bay r	supplies	0b02eac8-9f21-4663-b1e0-7ccf91064bd5	\N	\N	\N
99a1b836-bfc7-4627-8dcd-48722132a496	7ad94a19-e85f-59e9-9e4e-167d6bce5581	2299	f	budget	salary	\N	2026-01-25 01:38:46.417636	2026-01-25 01:38:46.417636	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
278c928a-02ee-4102-aee6-546cc2ecb701	c3a43958-1c4e-5afc-aa51-6fe13b7b2f2e	500000	f	loan	\N	\N	2026-01-25 01:41:13.208437	2026-01-25 01:41:13.208437	WITHDRAWAL-OSKO PAYMENT 1618357 AHMED HASAN AHMED  AL-HAMED Personal loan to be deducted from a	\N	\N	a379af81-6c5f-4c4e-9dad-894becaccd76	\N	\N
4eb9a4ad-ea4f-4e45-90aa-d97274a16381	f5259c47-437f-5ccc-820c-f2e523c995ac	3690	t	budget	food	\N	2026-01-25 01:41:25.224871	2026-01-25 01:41:25.224871	DEBIT CARD PURCHASE KFC Menai              Menai        AUS Card No. ~054253	\N	\N	\N	\N	\N
94822e84-9032-4492-877b-edf3fd84c326	7f519fc3-1540-55a0-88d2-efb054680c29	2050	t	budget	food	\N	2026-01-25 01:41:41.889646	2026-01-25 01:41:41.889646	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	\N	\N	\N	\N	\N
dcf87d36-4918-4944-8891-50ae84b62808	a225606c-18d7-56cf-88fe-ec3d5e99c74d	70000	t	budget	salary	\N	2026-01-25 01:41:50.141004	2026-01-25 01:41:50.141004	WITHDRAWAL MOBILE 1513061 PYMT Starr Part House&Workshop ren	\N	\N	\N	\N	\N
26aed9f4-7b56-4d19-b7af-f2e21f3ef820	2231935d-ba67-515b-a6e1-706367bec13b	2100	t	budget	food	\N	2026-01-25 01:42:02.436067	2026-01-25 01:42:02.436067	DEBIT CARD PURCHASE 7-ELEVEN 2171 SOUTH HURSTV AUS Card No. ~054253	\N	\N	\N	\N	\N
a0428e72-7352-4a9c-8cea-79c4bf05b05c	e2715c8e-f116-5911-b643-c81a87370132	1550	t	budget	food	\N	2026-01-25 01:42:15.311249	2026-01-25 01:42:15.311249	DEBIT CARD PURCHASE 7-ELEVEN 2171 SOUTH HURSTV AUS Card No. ~054253	\N	\N	\N	\N	\N
28395a14-22ac-4e25-895a-b2d313b0d09a	c1302bd0-22c1-5893-9121-9c4c047c7bb2	3835	t	budget	food	\N	2026-01-25 01:42:29.311007	2026-01-25 01:42:29.311007	DEBIT CARD PURCHASE KFC Miranda Miranda      AUS Card No. ~054253	\N	\N	\N	\N	\N
a1a53fcd-d4c1-4169-8775-83f47c8d5559	5d97f632-0ec7-503e-ad0f-35c962021fd4	100000	f	budget	salary	\N	2026-01-25 01:42:37.134545	2026-01-25 01:42:37.134545	WITHDRAWAL-OSKO PAYMENT 1677585 A AL-MATARI Salary	\N	\N	\N	\N	\N
ae07347f-d7d4-47cf-9e5d-51bb00df3b17	7befa57a-87e4-5c47-a931-f9c4e4b76518	400	t	budget	food	\N	2026-01-25 01:42:46.372166	2026-01-25 01:42:46.372166	DEBIT CARD PURCHASE 7-ELEVEN 2011 GUILDFORD WE AUS Card No. ~054253	\N	\N	\N	f	\N
e1a29e9d-6135-431a-8202-84ed24526a15	a9ed7ccc-d198-55e8-aa38-8ffcc86fc75d	107800	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:43:17.579243	2026-01-25 01:43:17.579243	EFTPOS DEBIT 0000796 ALL METAL CURVING  \\ ST HUBERTS ISLA 12/01 Card No. ~054253	supplies	c12b4478-e321-439a-8331-72d0f727501e	\N	\N	\N
9ca0a639-e547-44c2-aee6-a0c6e337e93d	f2309bf6-2071-5da3-a142-dccd9a46760f	5999	f	budget	salary	\N	2026-01-25 01:44:46.337893	2026-01-25 01:44:46.337893	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
4da8a84a-d9c5-498b-8dfb-0db48c0042e1	1ca03bae-0b57-5e06-8ba8-b7c8911c6608	550	t	budget	food	\N	2026-01-25 01:46:18.471954	2026-01-25 01:46:18.471954	DEBIT CARD PURCHASE 7-ELEVEN 2011 GUILDFORD WE AUS Card No. ~054253	\N	\N	\N	\N	\N
38a41a51-d5a5-4d58-b1b3-b3e98aee3d11	35030aac-d5fd-57df-a90c-e124b597f6e2	1500000	f	refunded	\N	\N	2026-01-25 01:46:44.93734	2026-01-25 01:46:44.93734	WITHDRAWAL-OSKO PAYMENT 1494335 Hashed Abdulghani Deposit 10 JAN 2026	\N	\N	\N	\N	\N
9bafdf4b-697f-49a8-a0be-b34f7c0837d0	3d36ce25-d9e5-5ec4-a553-57443776d33b	1500000	f	refund	\N	\N	2026-01-25 01:46:52.718331	2026-01-25 01:46:52.718331	DEPOSIT-OSKO PAYMENT 2032261 HASHED AHMED MOHAMMED ABDULGHANI Deposit Refund	\N	\N	\N	\N	\N
6fac2f12-6a95-4ff4-869f-fcdd27c91aea	83698fb2-04cd-545d-a02d-6463aec43610	11594	t	budget	fuel	\N	2026-01-25 01:47:05.194679	2026-01-25 01:47:05.194679	DEBIT CARD PURCHASE COSTCO GAS AUBURN LIDCOMBE     AUS Card No. ~054253	\N	\N	\N	\N	\N
27f45bc0-4ea9-40bf-b30b-ddd477431206	e0413120-7093-591b-8c59-1f2184d6fa8a	3050	t	budget	food	\N	2026-01-25 01:47:13.836303	2026-01-25 01:47:13.836303	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	\N	\N	\N	\N	\N
3848f309-2aef-4bb8-ae42-fca071be5a88	04fce938-a672-5062-bbaf-31cf2315e6dc	1599	f	budget	salary	\N	2026-01-25 01:48:47.155349	2026-01-25 01:48:47.155349	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	\N	\N	\N	\N	\N
e57e131b-4c06-4494-9e76-a6d7323aa94b	0a070441-504f-51f6-9018-651df8439141	49410	t	budget	tool	\N	2026-01-25 01:50:21.630088	2026-01-25 01:50:21.630088	DEBIT CARD PURCHASE BUNNINGS 548000 SMITHFIELD   AUS Card No. ~054253	\N	\N	\N	\N	\N
64a87c5c-5ae7-4648-adf9-00bc429c286f	a70f9e7d-f299-5719-8a08-ac5924b2ea66	950	t	budget	food	\N	2026-01-25 01:50:29.268532	2026-01-25 01:50:29.268532	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	\N	\N	\N	\N	\N
b3f83f09-429e-4ef7-b59d-a65ce76f087d	f41a413b-66cd-531b-a356-f695d05a89af	70000	t	budget	salary	\N	2026-01-25 01:50:46.3743	2026-01-25 01:50:46.3743	WITHDRAWAL MOBILE 1554500 PYMT Starr Part House&Workshop ren	\N	\N	\N	\N	\N
226efaf4-6672-41d5-b081-607503209c3b	182f1dac-a225-51c6-871a-bed3ab651163	110000	f	budget	salary	\N	2026-01-25 01:50:56.627311	2026-01-25 01:50:56.627311	WITHDRAWAL-OSKO PAYMENT 1079064 A AL-MATARI	\N	\N	\N	\N	\N
7b7da2a9-6611-4c9d-9b5d-cab893c873ab	a084a9cb-d972-5d5d-b174-032a4ef15a71	200	t	budget	consumable	\N	2026-01-25 01:51:06.919123	2026-01-25 01:51:06.919123	EFTPOS DEBIT 0136890 OFFICEWORKS 0272 AUBURN        19/01 Card No. ~054253	\N	\N	\N	\N	\N
013f73bf-3641-42de-adc0-e3a29d5b851b	64ff8812-40e9-5bab-8e47-b873860f85fd	1311	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:51:39.076013	2026-01-25 01:51:39.076013	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	supplies	400c012e-7040-49d0-a64a-38b0c34bd638	\N	\N	\N
78d8c69e-7a17-4096-b78b-1678699d4790	75ac822c-307d-5caf-9504-80c6bca1b707	12000	t	budget	fuel	\N	2026-01-25 01:52:06.768446	2026-01-25 01:52:06.768446	DEBIT CARD PURCHASE COSTCO GAS AUBURN LIDCOMBE     AUS Card No. ~054253	\N	\N	\N	\N	\N
86b81ff1-bddf-45b5-b141-070c337140d1	c40c6935-1f5c-5e75-8a36-bfa50ed0cc46	76890	t	budget	subscription	\N	2026-01-25 01:52:17.244562	2026-01-25 01:52:17.244562	EFTPOS DEBIT 0211182 hipages tradiecore\\             17/01 Card No. ~054253	\N	\N	\N	\N	\N
84885ef7-9f7c-4061-ad59-14fae422dc90	ea656dba-48ad-5e8b-b186-88cbe9010188	48105	f	budget	salary	\N	2026-01-25 01:52:25.691738	2026-01-25 01:52:25.691738	PAYMENT BY AUTHORITY TO Oz Education Gui A00L5E2Y05X4	\N	\N	\N	\N	\N
f10cda8d-83a2-4d31-9202-6a997d983967	49d95ca3-943d-5228-afe9-6ab0553d25f8	300000	f	loan	\N	\N	2026-01-25 01:53:02.64329	2026-01-25 01:53:02.64329	DEPOSIT-OSKO PAYMENT 2913204 MOHAMMED BA HUTAIR Other	\N	\N	f756e0b5-e2c1-4787-9d82-b9985d3073b1	\N	\N
d82c9c64-106e-49a1-b866-5d8c8d31418e	85d3722a-c469-50e6-a236-6e992988e9ab	1300000	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:53:50.946117	2026-01-25 01:53:50.946117	WITHDRAWAL-OSKO PAYMENT 1908947 Mr top Group Pty Ltd Payment for the job Caringbah	supplies	c33b8f42-59b1-4f67-99ea-f5daa8e83e67	\N	\N	\N
292364af-c7ec-4e10-acac-58cdf2e0e95d	8084f0f3-21f6-560e-99b7-4c934ad5ab88	795	t	budget	food	\N	2026-01-25 01:54:32.222619	2026-01-25 01:54:32.222619	EFTPOS DEBIT 0020410 UNITED RYDALMERE   \\ RYDALMERE       19/01 Card No. ~054253	\N	\N	\N	\N	\N
fc76c4a0-6552-409a-a3b8-b2e5ddbdc05e	5a692964-27a5-5b36-8ab3-0174c5b83c32	12900	t	refund	\N	\N	2026-01-25 01:54:42.704963	2026-01-25 01:54:42.704963	DEBIT CARD REFUND BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	\N	\N	\N	\N	\N
1e675407-6cef-4d1c-b2a6-cc1269e1ed35	f20952a8-5840-53eb-a010-03e87e6e9521	1475	t	budget	food	\N	2026-01-25 01:54:52.815515	2026-01-25 01:54:52.815515	DEBIT CARD PURCHASE AMPOL PADSTOW 22887QPS PADSTOW      AUS Card No. ~054253	\N	\N	\N	\N	\N
ed61a88e-6e4e-4f7e-bcc2-a7e7d767abc9	9273fcff-9b8f-596f-aea3-87d68fc1745d	250	t	budget	food	\N	2026-01-25 01:55:03.791917	2026-01-25 01:55:03.791917	EFTPOS DEBIT 0270687 SHELL REDDY EXPRESS SOHurstville So 21/01 Card No. ~054253	\N	\N	\N	\N	\N
632f1fa5-a558-438e-8cc6-140a3d4bdaca	0b075136-14ec-5b27-83b5-fded0b64f192	70000	t	budget	salary	\N	2026-01-25 01:55:13.436205	2026-01-25 01:55:13.436205	WITHDRAWAL MOBILE 1455304 PYMT Starr Part House&Workshop ren	\N	\N	\N	\N	\N
fd6f32d2-461e-4b7b-9de8-f39e380f4444	1cfbbb31-994d-5840-ac09-aa298e0989dc	13236	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:56:15.903926	2026-01-25 01:56:15.903926	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	supplies	1e7491d1-49ab-4f56-9c81-7b36380b3780	\N	\N	\N
d8594bb4-a22c-4d82-a92a-248338dc0b86	0c0dd12e-2907-5b21-a38b-392259ec17f0	5192	t	project	\N	02a755e1-a5cb-4b07-9a24-d9528b1374d0	2026-01-25 01:56:46.347617	2026-01-25 01:56:46.347617	DEBIT CARD PURCHASE YT ALUMINIUM AUSTRALIA MILPERRA     AUS Card No. ~054253	supplies	16c1eca4-311a-4dcc-a016-8f3474e7e9d9	\N	\N	\N
\.


--
-- Data for Name: financial_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.financial_accounts (id, name, created_at, updated_at, sync_with_bank) FROM stdin;
ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	Bank account	2025-11-21 23:28:50.119304	2025-11-22 00:15:49.413	westpac
1585ae15-8217-40f9-81d9-de856f31e4dc	Cash account	2025-11-21 23:28:41.747366	2025-11-21 23:59:09.66	\N
\.


--
-- Data for Name: loan_payoffs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loan_payoffs (id, loan_id, amount, date, notes, reconciliation_id, created_at, updated_at) FROM stdin;
1e4e62d9-dccb-49a7-8d63-38032134ea5b	70a70232-40ca-4e74-ae19-64497417cf7a	50000	2025-08-26		1f3e6b35-0a31-4617-b3ca-3c41f4404973	2026-01-02 13:09:25.419949	2026-01-02 13:09:25.419949
b7e95ed8-1191-4eb9-abdb-b5c60c79ac9c	01820c2e-8372-4454-acc4-567e528a1928	15670	2025-09-01		c257a100-f568-4272-b54c-dfbe48f76f07	2026-01-02 13:10:00.623379	2026-01-02 13:10:00.623379
\.


--
-- Data for Name: loans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.loans (id, type, party_name, amount, date, due_date, notes, reconciliation_id, created_at, updated_at) FROM stdin;
ddb9733e-826f-4be7-a5c0-a0c77f04fbf3	lent	Ahmed Almatari	1599	2025-11-13	\N	\N	a69a214d-de67-4782-ae7f-6b0c9e81f535	2026-01-02 13:10:24.791146	2026-01-02 13:10:24.791146
127b223e-ee04-45b8-9160-c4ea5eda992f	lent	Ziad Alawalaqi	50000	2025-12-21	2025-12-18	\N	6560e0d7-56c9-4f86-9371-e4234568de47	2026-01-02 13:10:45.200153	2026-01-02 13:10:45.200153
70a70232-40ca-4e74-ae19-64497417cf7a	lent	Ahmed Almatari	50000	2025-08-25	\N	\N	bee4cb84-66f0-4467-86e5-0db2ff327432	2026-01-02 13:09:11.532634	2026-01-02 13:09:11.532634
990e0301-902f-43ce-b608-5012d233d136	lent	Ahmed Almatari	420000	2025-08-08	2026-08-08	Home deposit	9f2158ae-19f3-4528-abb0-bd475c1e9f0d	2026-01-02 13:08:13.110624	2026-01-02 13:08:13.110624
01820c2e-8372-4454-acc4-567e528a1928	lent	Ahmed Almatari	15670	2025-09-01	\N	\N	\N	2026-01-02 13:09:47.676329	2026-01-02 13:09:47.676329
a379af81-6c5f-4c4e-9dad-894becaccd76	lent	Ahmed Alhamid	500000	2026-01-08	2026-02-23	Should be deducted from his labor	278c928a-02ee-4102-aee6-546cc2ecb701	2026-01-25 01:41:07.181954	2026-01-25 01:41:07.181954
f756e0b5-e2c1-4787-9d82-b9985d3073b1	borrowed	Mohammed Nasser	300000	2026-01-20	2026-01-30	\N	f10cda8d-83a2-4d31-9202-6a997d983967	2026-01-25 01:52:58.844145	2026-01-25 01:52:58.844145
\.


--
-- Data for Name: project_labors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_labors (id, project_id, name, hours, rate, reconciliation_id, created_at, updated_at) FROM stdin;
105d6a1c-f174-44c1-93b9-26feb109b754	9757617a-6853-459d-bd33-4feac0b3c5b9	Faisal Jabi	8	2500	\N	2026-01-02 12:34:56.762009	2026-01-02 12:34:56.762009
1b40bb40-1376-4af0-baaa-bdb160bcf794	b999eb78-03af-4adc-84d6-1e0142d8d57a	Faisal Jabi	6	2500	\N	2026-01-02 12:34:56.799863	2026-01-02 12:34:56.799863
06976e10-75b6-47cb-bc01-e258166d62db	b999eb78-03af-4adc-84d6-1e0142d8d57a	Marlon	16	2500	\N	2026-01-02 12:34:56.801133	2026-01-02 12:34:56.801133
ec506fdb-6bc6-43da-8743-0e646d7ed1ab	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Ziad	8	2500	\N	2026-01-02 12:34:56.81391	2026-01-02 12:34:56.81391
5e39417d-360b-4386-a645-9715869d2d48	ea74d278-b4c1-4f03-9ae9-426764acce85	Faisal Jabi	6	2500	\N	2026-01-02 12:34:56.829978	2026-01-02 12:34:56.829978
06b0b168-356a-40ce-adda-f59bfb71c7c4	ea74d278-b4c1-4f03-9ae9-426764acce85	Ahmed	8	2500	\N	2026-01-02 12:34:56.834791	2026-01-02 12:34:56.834791
1f715dac-75c3-44c6-9901-f99281afdcaf	b4c26b44-88bc-4194-a735-7c45a3e9a497	Ahmed Alhamed	8	2500	\N	2026-01-02 12:34:56.890124	2026-01-02 12:34:56.890124
960cb57f-820f-45ca-aa39-e1d9751be3cd	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	Ahmed Alhamed	8	2500	\N	2026-01-02 12:34:56.924696	2026-01-02 12:34:56.924696
d740dc16-5a7c-4367-8c51-9c2048239079	a7edf71d-c062-4f95-9e3c-d8bc8c532983	Ahmed Alhamed	8	2500	67d8f5de-2838-46d4-a3cc-c3e0de4a539e	2026-01-02 12:34:56.99362	2026-01-02 12:34:56.99362
418a9779-af4f-42d6-a974-f65f377cadb0	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	Ahmed Alhamed	12	2500	f928f795-85cc-4332-8b2c-b0b8cb9313a3	2026-01-02 12:34:57.003363	2026-01-02 12:34:57.003363
42d2b00a-ffff-4f45-851f-7a68474936f9	d5fb1006-decb-4956-9088-ab2b73b962cf	Ahmed Alhamed	8	2500	6f730950-2faa-4db5-aeff-7b1cd114049d	2026-01-02 12:34:57.01406	2026-01-02 12:34:57.01406
3fc9be1d-31b3-4990-9229-d9e6d3bc2567	b6320ca9-8b3a-4451-8118-1b6b0544f986	Ahmed Alhamed	8	2500	234adbae-0429-41e7-a079-2e2413ad608e	2026-01-02 12:34:57.025258	2026-01-02 12:34:57.025258
2f85bf7a-3fad-4289-995d-f460ca595887	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	Ahmed Alhamed	8	2500	fb2ef097-1d84-46ab-b6bd-90c215fe9061	2026-01-02 12:34:57.00427	2026-01-02 12:34:57.00427
796a766f-38ac-4081-9227-12bf0d1c1c0f	d23c367d-7648-4f2e-bb88-775552ead5a9	Ahmed Alhamed	4	2500	42094a05-47ec-4aa1-bc1f-ef6996a0c220	2026-01-02 12:34:56.988166	2026-01-02 12:34:56.988166
371445cb-67de-4890-969c-09b9fbf96210	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Ahmed Alhamed	10	2500	48e4e25d-d5f5-4044-b559-22cfcd819f6e	2026-01-02 12:34:57.040994	2026-01-02 12:34:57.040994
f29355b1-ba49-4cf4-aecf-d73abcc42ede	39f350e5-58fd-402e-955b-612f29624236	Ahmed Alhamed	8	2500	3648a29d-a5c2-40b6-a225-4b1ba8d09184	2026-01-02 12:34:57.020325	2026-01-02 12:34:57.020325
9e49a944-7886-4057-8a24-5efc1f681d28	92b06e18-1882-4d30-8338-5ef8ed47ee8d	Ahmed Alhamed	6	2500	2082bec0-0066-4255-af29-06e65e6e54b4	2026-01-02 12:34:57.058664	2026-01-02 12:34:57.058664
2a014e8d-ed02-41e8-a1d2-061c38391176	4e96cf11-e67e-42d4-8096-c604e7b041be	Ahmed Alhamed	10	2500	b4e545cd-71e0-4d55-b58f-59fe58dd7a6a	2026-01-02 12:34:57.050071	2026-01-02 12:34:57.050071
5fa2c097-f424-445b-8b7b-6ab6bd1fb909	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Ahmed Alhamed	10	2500	cb8ed1e7-cdfe-4b12-bc41-5a518ec9b42b	2026-01-02 12:34:57.086525	2026-01-02 12:34:57.086525
2b819a00-3021-4cbb-8d2b-d9f79fe08612	f249b0de-1fa6-4027-baa2-89f04b0f24ca	Ahmed Alhamed	10	2500	849803f4-bbb4-4660-86a3-649cf1317f1f	2026-01-02 12:34:57.062931	2026-01-02 12:34:57.062931
b00fd586-4a62-42c5-bf6f-2758df0d3d00	76a4a8c5-3e73-47b9-9416-030909165ed7	Ahmed Alhamed	10	2500	f06a7dac-d7ad-4057-ac38-213a6a0f2156	2026-01-02 12:34:57.055018	2026-01-02 12:34:57.055018
0474f716-ac5c-4a5a-bddd-53bd35145cf8	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Ahmed Alhamed	10	2500	5f6362aa-165b-48fb-8427-a6c87d8a3666	2026-01-02 12:34:57.088208	2026-01-02 12:34:57.088208
60a15df0-0cef-4cde-991e-5583bc01257b	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Ziad	8	2500	170d73b5-45b9-45da-bcaa-28f936120b47	2026-01-02 12:34:57.088758	2026-01-02 12:34:57.088758
ad9fb194-6149-43b6-b7ce-1185973ed940	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Ahmed Alhamed	16	2500	04f27eea-a257-4c16-9d98-04e02b7556cb	2026-01-02 12:34:57.089288	2026-01-02 12:34:57.089288
4d855221-40ff-4d06-a12e-48f3c49bf6bf	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Ahmed Alhamed	16	2500	ee043dc3-6fd2-403b-890f-a61cbdee8497	2026-01-02 12:34:57.146137	2026-01-02 12:34:57.146137
8a2be798-14ee-4d18-b04a-4dc60d423f23	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	Ahmed Alhamed	4	2500	3aa8111f-3ec5-42fd-a350-4852244ff980	2026-01-02 12:34:57.153878	2026-01-02 12:34:57.153878
b28c5540-7bb7-4127-8d91-547f3a48b064	005c1242-89c9-4d64-b11d-5d983b4735a8	Ahmed Alhamed	4	2500	0ca22e11-36e3-436a-aad0-cba3f664ac3a	2026-01-02 12:34:57.129537	2026-01-02 12:34:57.129537
28ce788e-d2b4-4f28-9af0-f3c6ccaaaa4f	9ba263d4-9d99-404b-9f47-109fc4fa4296	Ahmed Alhamed	10	3000	b2b05dfd-bbda-4617-9e43-980c148e908e	2026-01-02 12:34:57.10208	2026-01-02 12:34:57.10208
4f29a4c6-b0ea-492c-8ee0-a7c5a9f11b3d	ea74d278-b4c1-4f03-9ae9-426764acce85	Ziad	8	2500	4337f137-4ae9-4499-909b-ed0030711eaf	2026-01-02 12:34:56.830808	2026-01-02 12:34:56.830808
7894c361-482f-4f66-abe5-91934da727f3	ea74d278-b4c1-4f03-9ae9-426764acce85	Ziad	8	2500	42d17d47-8474-4b0d-a580-c235962fdd27	2026-01-02 12:34:56.831634	2026-01-02 12:34:56.831634
20f874ca-cbea-4196-8072-9b6f67cfe1bd	ea74d278-b4c1-4f03-9ae9-426764acce85	Ahmed	8	2500	1542b29c-123e-496e-a39f-c4cf0d4b3e88	2026-01-02 12:34:56.833626	2026-01-02 12:34:56.833626
dd3386cd-84f9-450b-929d-3ebcdccfd76a	690b704e-00f1-4669-ba84-0313730faf10	Ahmed Alhamed	8	2500	e402e777-477e-4aa6-bc62-07f7fa6c86fe	2026-01-02 12:34:56.850236	2026-01-02 12:34:56.850236
f3be241e-f513-4278-a12a-9f4690647ce7	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	Ziad	8	2500	5f622ed6-4daa-4e15-8827-a95bb0d7bbf4	2026-01-02 12:34:57.153289	2026-01-02 12:34:57.153289
41e3a7f3-486c-4b95-97a8-adcc8487dc69	c54b137c-8ed7-425c-a408-80272ba1c953	One guy	8	2500	\N	2026-01-02 12:34:56.777137	2026-01-02 12:34:56.777137
7374a915-7752-4bc3-801e-d53bf026dd89	b999eb78-03af-4adc-84d6-1e0142d8d57a	Marlon	2	3000	\N	2026-01-02 12:34:56.80226	2026-01-02 12:34:56.80226
3568f7a2-133c-4cd2-9f0b-b653e6211344	690b704e-00f1-4669-ba84-0313730faf10	Ahmed Alhamed	8	2500	\N	2026-01-02 12:34:56.849282	2026-01-02 12:34:56.849282
260ba683-6e63-4740-8e44-930444219a09	690b704e-00f1-4669-ba84-0313730faf10	Ahmed Alhamed	8	2500	709f56a4-7dc9-4ad1-ab78-75c7f5aebcf1	2026-01-04 10:40:28.849952	2026-01-04 10:40:28.849952
99832512-bffd-45be-91bf-59ef8fa57f39	70834d5a-77e2-46bb-aaad-6878642480db	Ahmed Alhamed	16	2500	7e3dab71-a72e-46c8-8e06-3bc8f8de8150	2026-01-02 12:34:56.877462	2026-01-02 12:34:56.877462
7e20483a-b5ee-410c-90f3-718b4c5bd59f	70834d5a-77e2-46bb-aaad-6878642480db	Ahmed Labor	8	2500	9af952bf-060d-4d7b-b132-c40a442fc22b	2026-01-04 18:34:36.03193	2026-01-04 18:34:36.03193
8a5b1f58-c318-4af1-81be-25b33489f6ee	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Ahmed Alhamed	32	2500	c23dc69d-646d-4d73-b399-813f6e5c5064	2026-01-02 12:34:56.916656	2026-01-02 12:34:56.916656
526f441c-304f-4257-926e-b84fef5a47f2	2c4ff727-51a4-4814-b167-ede3ea556e77	Ahmed Alhamed	8	2500	\N	2026-01-02 12:34:56.938266	2026-01-02 12:34:56.938266
f8065a53-2924-4216-b56f-ad8937c04d16	2c4ff727-51a4-4814-b167-ede3ea556e77	Ahmed Alhamed	16	2500	3721205e-ab7e-4695-9b56-fed06fa07bad	2026-01-02 12:34:56.937594	2026-01-02 12:34:56.937594
08f847d2-4e60-44c3-81d8-25494232757f	2c4ff727-51a4-4814-b167-ede3ea556e77	Ahmed Alhamed	8	2500	6a1fe027-425a-40a3-b888-fe2e8a3b01e7	2026-01-04 18:49:38.390649	2026-01-04 18:49:38.390649
b0e44ec3-aace-459b-9e2a-3ace6b61df76	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Ziad	18	2500	7e245cd9-a46f-4051-90e6-ed348afb4244	2026-01-02 12:34:57.087495	2026-01-02 12:34:57.087495
\.


--
-- Data for Name: project_misc; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_misc (id, project_id, name, amount, reconciliation_id, created_at, updated_at) FROM stdin;
9cd9ef4a-589a-4398-ab88-27d25773df66	9757617a-6853-459d-bd33-4feac0b3c5b9	Fuel	10000	\N	2026-01-02 12:34:56.763883	2026-01-02 12:34:56.763883
42451072-d2b5-4817-add8-188a65490610	c54b137c-8ed7-425c-a408-80272ba1c953	Fuel	12000	\N	2026-01-02 12:34:56.780298	2026-01-02 12:34:56.780298
9e9db28a-f3fe-42ba-9146-adb8d14834cc	49cd8378-4481-4c2d-9e9e-268241211306	Fuel	12000	\N	2026-01-02 12:34:56.789628	2026-01-02 12:34:56.789628
0fa11fcb-1e46-438a-a55a-d13759f90e64	b999eb78-03af-4adc-84d6-1e0142d8d57a	Fuel	12000	\N	2026-01-02 12:34:56.803545	2026-01-02 12:34:56.803545
d2f40514-1118-4621-a8ea-b1ed77b96745	b999eb78-03af-4adc-84d6-1e0142d8d57a	Fuel	9000	\N	2026-01-02 12:34:56.804953	2026-01-02 12:34:56.804953
75f31894-69ed-4380-ab27-05c31146fb29	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Fuel	6000	\N	2026-01-02 12:34:56.815026	2026-01-02 12:34:56.815026
880fdb41-fc45-4d78-8133-d789862cd467	ea74d278-b4c1-4f03-9ae9-426764acce85	Fuel	6000	\N	2026-01-02 12:34:56.83575	2026-01-02 12:34:56.83575
1824beb6-47a5-43ac-8910-4667de26b194	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	3990	\N	2026-01-02 12:34:56.836972	2026-01-02 12:34:56.836972
40d4146f-76d9-43fd-b67e-3d6eb965a53c	9ba263d4-9d99-404b-9f47-109fc4fa4296	Car accident	50000	d89d7cbe-592f-4b66-9cc5-9c1a33bd925d	2026-01-02 12:34:57.102864	2026-01-02 12:34:57.102864
defa2539-4580-48b3-bcb0-02fd3bd9b65e	70834d5a-77e2-46bb-aaad-6878642480db	Tool hire	20000	913472ba-a1a9-411a-baa9-45929d194fb0	2026-01-02 12:34:56.884381	2026-01-02 12:34:56.884381
1d81140b-bebe-42fd-a736-c03b06922aaa	690b704e-00f1-4669-ba84-0313730faf10	Food	350	d642afe2-e5e0-4b57-91cc-784674b6a9b6	2026-01-02 12:34:56.852252	2026-01-02 12:34:56.852252
4290797a-4280-43f7-8e92-d7ce5097b4ac	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	1360	ce2b725d-e8ba-4cc6-9a54-6a8a6e0a220c	2026-01-02 12:34:56.837696	2026-01-02 12:34:56.837696
e68da24d-3c93-49fc-b505-da9e356afd02	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	587	f6e81bce-1357-44e4-9439-13e7fd2d748d	2026-01-02 12:34:56.838856	2026-01-02 12:34:56.838856
b8420065-4774-4b99-88c4-a8326325ee2b	7b4689a1-e4cd-479a-bab9-802def112c4e	Fuel	10000	ca721268-ec17-4ceb-888f-254583758682	2026-01-02 12:34:56.825585	2026-01-02 12:34:56.825585
482b4702-4ac1-405c-ae6f-d414d76be88c	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	4200	7a0360ac-bfa6-493f-a488-4d5ea858eb9d	2026-01-02 12:34:56.839425	2026-01-02 12:34:56.839425
47bd7c9f-dd3d-4c5e-9c41-268bf3755e01	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	400	25d04d70-f5e4-4f3c-8351-6a204f81e3d2	2026-01-02 12:34:56.840402	2026-01-02 12:34:56.840402
5b9a57e0-5a7e-4fbc-bda9-792baed42333	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	Food	350	689a5a01-e8d2-4934-b0ac-3b2ed0ddfb6d	2026-01-02 12:34:56.864405	2026-01-02 12:34:56.864405
96e96e77-c974-4961-85e4-7156a45398f2	70834d5a-77e2-46bb-aaad-6878642480db	Parking	406	b62a49d6-6e83-40b2-b482-7ac47b260c53	2026-01-02 12:34:56.879274	2026-01-02 12:34:56.879274
2caad5cf-c7f3-4445-8e4e-82ae9d048d82	70834d5a-77e2-46bb-aaad-6878642480db	Food	2120	5e08754f-b8e0-4be0-ba89-53fb36d0a853	2026-01-02 12:34:56.880097	2026-01-02 12:34:56.880097
be01b359-1cfe-4a84-8178-856cbca566f0	690b704e-00f1-4669-ba84-0313730faf10	Food	4200	affe2e4b-b2b7-40af-9fe2-2ee814294001	2026-01-02 12:34:56.853273	2026-01-02 12:34:56.853273
0ef68285-954b-4b59-a44e-d244dabc2e3d	690b704e-00f1-4669-ba84-0313730faf10	Food	898	12a3a226-38a0-426b-8a37-425b280c8296	2026-01-02 12:34:56.85484	2026-01-02 12:34:56.85484
8c65d178-4bdf-4ba1-a011-2d30a9f24f00	690b704e-00f1-4669-ba84-0313730faf10	Food	3150	e3c257cb-dd5d-49a4-ae72-bf4666899720	2026-01-02 12:34:56.85786	2026-01-02 12:34:56.85786
1092b9bf-838b-4716-86c2-6b333eb5a1c2	690b704e-00f1-4669-ba84-0313730faf10	Fuel	10584	de872db7-dbf4-4688-baa7-3c21fe4f8460	2026-01-02 12:34:56.858529	2026-01-02 12:34:56.858529
2fa1f923-90c4-4275-92ac-eb3279751151	76a97d96-3b40-4c24-bfbe-e16362c59574	Food	2150	8eff7593-6125-4e04-bec6-4f0c5fad48d8	2026-01-02 12:34:56.898223	2026-01-02 12:34:56.898223
425ca8f9-c6b9-4eb5-b3ab-50340cd82066	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Settlement	250000	93ddaf50-41db-4a2f-917f-c68b3292dd93	2026-01-02 12:34:56.817293	2026-01-02 12:34:56.817293
f978b63a-bf87-4ce3-b5de-88827428aac9	690b704e-00f1-4669-ba84-0313730faf10	Food	4585	410944a7-4506-4d96-831b-a9da08f622b5	2026-01-02 12:34:56.859127	2026-01-02 12:34:56.859127
07f57b09-1631-42ae-8dfa-9682dba1f259	70834d5a-77e2-46bb-aaad-6878642480db	Fuel	10000	e8c7cbb3-36fd-4468-8016-acfb9ea1daec	2026-01-02 12:34:56.880836	2026-01-02 12:34:56.880836
275122b5-3e61-418e-9fe2-08a5f774717e	70834d5a-77e2-46bb-aaad-6878642480db	Fuel	12297	5738338e-20b4-4f2f-91fa-55afb3e8cb53	2026-01-02 12:34:56.881576	2026-01-02 12:34:56.881576
fc4e3215-7586-4f21-b491-1139961c6f58	70834d5a-77e2-46bb-aaad-6878642480db	Food	1270	0619edbf-a284-461c-a930-1c7aa4527c52	2026-01-02 12:34:56.882419	2026-01-02 12:34:56.882419
fdfae98c-93cd-4562-92b9-20422f9d5b71	70834d5a-77e2-46bb-aaad-6878642480db	Food	2390	5c86588b-40a0-4135-b5a6-692ad8fe2ab2	2026-01-02 12:34:56.883079	2026-01-02 12:34:56.883079
13da6994-ed87-4cd1-95df-6850143e75f7	b4c26b44-88bc-4194-a735-7c45a3e9a497	Fuel	10000	fc4e1273-7021-41b3-8e1f-5428006a18f6	2026-01-02 12:34:56.890899	2026-01-02 12:34:56.890899
299dc266-ea7e-4e39-8160-a6ea83e2e1a4	b4c26b44-88bc-4194-a735-7c45a3e9a497	Food	695	2f6c4e2f-9d24-4c16-91b3-e43980163d71	2026-01-02 12:34:56.891627	2026-01-02 12:34:56.891627
64bb8a09-6051-49bf-874e-e2bd23ec1f2e	b4c26b44-88bc-4194-a735-7c45a3e9a497	Food	1945	4245b7b1-4e70-484d-94c0-05c5b0dcd2de	2026-01-02 12:34:56.89233	2026-01-02 12:34:56.89233
8f189de1-cfa2-44fc-acfc-0ee8b218f3e3	b4c26b44-88bc-4194-a735-7c45a3e9a497	Fuel	10000	03ef0957-03cd-462c-a6a6-c1aea36e7d9e	2026-01-02 12:34:56.892933	2026-01-02 12:34:56.892933
4323b198-9c90-4821-9e14-36c8e5fe67fb	2c4ff727-51a4-4814-b167-ede3ea556e77	Food	3150	67e1b191-0419-41b8-9596-c8554cfe48dd	2026-01-02 12:34:56.939549	2026-01-02 12:34:56.939549
6536da88-40a2-4ef8-b3c5-872a4cbe25f7	2c4ff727-51a4-4814-b167-ede3ea556e77	Food	4200	eeb67c2e-0e2a-4005-a561-cff9e664e08a	2026-01-02 12:34:56.940166	2026-01-02 12:34:56.940166
8275753d-cb65-47b3-8ff2-fb66b54873c4	2c4ff727-51a4-4814-b167-ede3ea556e77	Food	1115	dd654fc9-b0bd-44ad-8c1b-1124b0d5b0e9	2026-01-02 12:34:56.941033	2026-01-02 12:34:56.941033
563962db-16fa-4416-91bb-15897f5aa906	2c4ff727-51a4-4814-b167-ede3ea556e77	Fuel	10000	d26c09d6-d047-4829-b19e-a1f8bde92016	2026-01-02 12:34:56.942268	2026-01-02 12:34:56.942268
b8a05734-2973-483d-81c5-867e7ba29332	2c4ff727-51a4-4814-b167-ede3ea556e77	Food	4200	02ea7de9-dee8-4d03-81de-2729f4eb56c2	2026-01-02 12:34:56.943252	2026-01-02 12:34:56.943252
756ed330-f1fc-41eb-9df5-eaaa47de000e	2c4ff727-51a4-4814-b167-ede3ea556e77	Food	2450	2df6dbc7-0d85-472b-8216-0722e2edf336	2026-01-02 12:34:56.946387	2026-01-02 12:34:56.946387
06fe88ce-f5c7-4ef4-bc48-a377d361617d	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Food	4320	a8495748-82c4-4568-b71a-5d77ffb24026	2026-01-02 12:34:56.917666	2026-01-02 12:34:56.917666
dd20c271-6c88-40ac-90fd-620ddfc637b3	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Food	950	9e4eba90-04d3-4ec9-95d5-2f1970a5550b	2026-01-02 12:34:56.91849	2026-01-02 12:34:56.91849
43308052-25d7-486b-9eb9-74c4056e92d8	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Fuel	4012	c4869aeb-c37e-46dd-bb41-749ebee6728b	2026-01-02 12:34:56.9196	2026-01-02 12:34:56.9196
d8341d7b-88d6-43ad-ac4e-636da2c53263	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	Transportation	18059	d377cb12-25fd-486f-b3b8-bd1ac2ee2f33	2026-01-02 12:34:56.925695	2026-01-02 12:34:56.925695
8f1b1955-d5aa-43eb-8f77-b5a423fe3fa3	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	Food	3820	5db3b113-2610-4191-940b-cdf03ebbb060	2026-01-02 12:34:56.928421	2026-01-02 12:34:56.928421
f2e174d2-1552-4f33-a669-86045865c41b	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	Step ladder hire	7200	2551e996-a8c1-4d25-9a49-4d7892a8a18c	2026-01-02 12:34:56.929475	2026-01-02 12:34:56.929475
483b6c5b-fb4c-4122-b426-ba3a2c2198ca	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	Fuel	11848	f5607da4-9c6b-48a3-bc77-fd63a0e5ea25	2026-01-02 12:34:56.930123	2026-01-02 12:34:56.930123
59045761-c6e0-4621-9463-1d03b42f7b46	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	Food	600	69bbc55a-a1b1-4eb0-a5cd-40368d3ad129	2026-01-02 12:34:56.972712	2026-01-02 12:34:56.972712
81cf2a4d-7fc9-43cb-8d2d-f102dcee24aa	35e96736-2752-4b0d-a07e-c25dc5b3c572	Food	4200	48bac2ae-cb45-4eb4-8f94-f402dd6af9b4	2026-01-02 12:34:56.960528	2026-01-02 12:34:56.960528
77c79b43-2b93-4b99-bcfb-d183c86224fc	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	1300	9e659179-d35e-4197-ad73-3d585a7e2f7b	2026-01-02 12:34:56.841085	2026-01-02 12:34:56.841085
f36b616d-4d06-4cfe-a5d1-c48f9f568c37	ea74d278-b4c1-4f03-9ae9-426764acce85	Fuel	8000	7e0753dd-4388-4850-ae25-b79f4456f440	2026-01-02 12:34:56.841877	2026-01-02 12:34:56.841877
436e6458-2983-490e-b760-b144cd67c8a8	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	Food	1797	b438e48b-7e49-4803-ad99-2bc1474774e9	2026-01-02 12:34:56.974456	2026-01-02 12:34:56.974456
75c73c1b-6099-4a8a-9664-2a96f2f405d1	af77b699-a683-496f-9a9e-61a7dca30b3d	Fuel	9918	1ddb7531-5a77-4b6e-a2fe-827acbbeeb0b	2026-01-02 12:34:56.955347	2026-01-02 12:34:56.955347
e7a91aae-d93b-4a36-bed4-7658a5feedc5	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Printing	528	ef0078d2-5ee7-4b11-ac06-dccb18e8ae1c	2026-01-02 12:34:57.139375	2026-01-02 12:34:57.139375
a896d498-e797-4428-b8f9-c1a9c2332866	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Hire	7200	eac351d8-8a39-4fc4-b3ba-03e112fd2c98	2026-01-02 12:34:57.146898	2026-01-02 12:34:57.146898
75c0a5e3-b539-48d3-a835-aee5fff2b05a	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Ladder hire	6000	91f49ebc-6be4-460a-a10f-f61e673b6d77	2026-01-02 12:34:57.147504	2026-01-02 12:34:57.147504
f31c11e9-e6dd-40de-aaba-8afd33928a59	9757617a-6853-459d-bd33-4feac0b3c5b9	Food	4000	\N	2026-01-02 12:34:56.765612	2026-01-02 12:34:56.765612
849da112-f1d5-4a08-8de2-1ae145948f4c	b999eb78-03af-4adc-84d6-1e0142d8d57a	Food	655	4d653d4b-8963-403c-8572-a23e122e5a7a	2026-01-02 12:34:58.462506	2026-01-02 12:34:58.462506
847ad8f8-ab2f-4095-a7ba-500e5704e3f6	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	Food	350	4b2e3523-cc9d-400f-a48d-13fe54027565	2026-01-02 12:34:58.9443	2026-01-02 12:34:58.9443
763502e6-eef9-4b78-9e64-1a44caafa425	49cd8378-4481-4c2d-9e9e-268241211306	Food	900	e02573cd-319e-4959-b762-da4e591ffec1	2026-01-02 12:34:58.580441	2026-01-02 12:34:58.580441
474a1f0c-0138-49f5-a489-b993c0bae2c2	690b704e-00f1-4669-ba84-0313730faf10	Food	350	f2261b66-ae33-4c1e-89e4-78aeb9130761	2026-01-02 12:34:58.814552	2026-01-02 12:34:58.814552
0c85727e-dbb8-48f3-a4ff-2a1011961d17	ea74d278-b4c1-4f03-9ae9-426764acce85	Fuel	43	0ba17b20-31ba-421a-888e-44e246e27135	2026-01-02 12:34:56.838304	2026-01-02 12:34:56.838304
d3aece44-5de7-413e-bc82-7bd95c7236d8	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	Fuel	10754	85be5e37-9704-48d9-81ab-d86683e26ecc	2026-01-02 12:34:56.865109	2026-01-02 12:34:56.865109
4948018c-c3ee-457d-bf9d-fb2c14808ddd	690b704e-00f1-4669-ba84-0313730faf10	Food	1858	4ea195c0-4c76-47d0-bad4-542b73cbd3b1	2026-01-02 12:34:56.856887	2026-01-02 12:34:56.856887
bddffd58-57f0-44fa-9aa9-84545cb2fb57	690b704e-00f1-4669-ba84-0313730faf10	Fuel	8000	e5540a18-fbfd-47c8-a62e-874153596815	2026-01-02 12:34:56.85974	2026-01-02 12:34:56.85974
a1c4deec-9162-4adc-a439-265321eda8e2	70834d5a-77e2-46bb-aaad-6878642480db	Food	1194	cbec3406-2ad5-424d-b25a-6d06e06441a5	2026-01-02 12:34:56.883721	2026-01-02 12:34:56.883721
1d6ff671-0a59-4c66-890d-765bdbd609bb	2c4ff727-51a4-4814-b167-ede3ea556e77	Food	1899	e19b275b-d1fe-4f91-afbf-9b3778716485	2026-01-02 12:34:56.938905	2026-01-02 12:34:56.938905
539b4792-90e8-4740-8a3e-164daeb66bb3	2c4ff727-51a4-4814-b167-ede3ea556e77	Food	700	bfbb5c93-7edd-48c1-a9d2-60a48fc8cca7	2026-01-02 12:34:56.944437	2026-01-02 12:34:56.944437
b9740582-4c9f-4b40-85fe-6f8befbf835b	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Food	300	c11098dc-d615-4f44-9977-66276bc5ad84	2026-01-02 12:34:56.920371	2026-01-02 12:34:56.920371
2790cbb0-1c32-4293-8c14-a4fadf19142d	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	Food	600	82b4341e-daaf-406a-8cb7-d3faa2f94a71	2026-01-02 12:34:56.973568	2026-01-02 12:34:56.973568
7a4e3554-bfbb-40cf-9ac1-c0a6567c35c1	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	Food	6248	f68228e8-533f-44a2-b7e9-b47601f05dd2	2026-01-02 12:34:56.975271	2026-01-02 12:34:56.975271
e706d936-2029-40f6-8182-8d86ebe15dd2	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Ladder hire	5900	3723ad26-be96-4038-bd73-7385fb1bef03	2026-01-02 12:34:57.148037	2026-01-02 12:34:57.148037
751211bb-de27-42eb-abf0-4438619cffd9	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	390	8e23504c-8ab4-4c23-b5cd-8304af0aab04	2026-01-04 10:03:57.752537	2026-01-04 10:03:57.752537
f021a9b5-07fb-43a4-a57e-429efa87b425	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	1800	137fa205-9def-4a3f-8bdd-527c26c98eb1	2026-01-04 10:03:35.013658	2026-01-04 10:03:35.013658
7f98d98f-74e0-47da-bd93-7c6046714ef5	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	900	96fe53c4-e29e-4946-a32e-d1c5488ce131	2026-01-04 10:03:27.209843	2026-01-04 10:03:27.209843
33b0830c-61b3-4f91-b89d-6cab3cb883b6	ea74d278-b4c1-4f03-9ae9-426764acce85	Food	900	5290587e-e1c7-4f0d-81d5-df5c0a1aa6f7	2026-01-04 10:03:30.938537	2026-01-04 10:03:30.938537
081a87a0-abca-4541-89ac-0d8d33c77a8e	ea74d278-b4c1-4f03-9ae9-426764acce85	Fuel	10000	eb5bf69e-4375-4964-bd0a-d06075d1ac92	2026-01-04 10:07:57.256249	2026-01-04 10:07:57.256249
19eb487c-cc6b-47c7-a19c-8ea5d7cd0f7b	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Ladder hire (refund)	-1400	9cfe9f2b-0730-42a4-b4d5-94be0b38a94f	2026-01-02 12:35:00.905079	2026-01-02 12:35:00.905079
\.


--
-- Data for Name: project_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_payments (id, project_id, amount, date, reconciliation_id, created_at, updated_at) FROM stdin;
b093880b-86f7-4ced-b7bf-d07777db6fda	9757617a-6853-459d-bd33-4feac0b3c5b9	286000	2025-05-30	\N	2026-01-02 12:34:56.767102	2026-01-02 12:34:56.767102
025feadd-1470-4bcb-8347-d4df59a89b9a	b999eb78-03af-4adc-84d6-1e0142d8d57a	275000	2025-07-02	\N	2026-01-02 12:34:56.806138	2026-01-02 12:34:56.806138
02a4ef83-b9e5-47ec-b1a8-d8d6e19c82fd	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	429792	2025-07-04	\N	2026-01-02 12:34:56.818587	2026-01-02 12:34:56.818587
9a287591-d106-49fb-b000-537c756abfd9	35e96736-2752-4b0d-a07e-c25dc5b3c572	120000	2025-09-13	161fac6f-b40b-4460-be26-ccff0ac076e6	2026-01-02 12:34:56.962475	2026-01-02 12:34:56.962475
02f72e69-4a71-4774-9295-89fbe1e10541	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	210000	2025-09-14	41530e4e-01fe-4152-8e51-752a77db2da5	2026-01-02 12:34:56.9687	2026-01-02 12:34:56.9687
1376dfd5-9cf4-4670-8b3c-94f8a600a0a6	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	50000	2025-09-14	bce1d6dc-7f6c-4f87-8eae-be8129ede39d	2026-01-02 12:34:56.97619	2026-01-02 12:34:56.97619
87945306-d723-4b61-a856-641720c9e987	a7edf71d-c062-4f95-9e3c-d8bc8c532983	50000	2025-09-20	9334ff0b-dd34-4cd5-9136-9de27d2697b5	2026-01-02 12:34:56.99793	2026-01-02 12:34:56.99793
f894b67f-2411-4f14-a678-06feb96dfa5d	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	275000	2025-09-26	6018268d-8bb9-4d12-8cb3-33b6b41b981d	2026-01-02 12:34:56.976882	2026-01-02 12:34:56.976882
08c0b13b-0ac0-42cc-b4cd-329b09aac812	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	250000	2025-09-27	47a381fd-7a30-48d7-9ead-45791c08b311	2026-01-02 12:34:56.967792	2026-01-02 12:34:56.967792
273981ce-e7e1-4fa7-9bbb-08fd0b0fa874	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	100000	2025-10-01	8104bfca-5c07-4ad1-a128-d7fee3402928	2026-01-02 12:34:57.006034	2026-01-02 12:34:57.006034
9572e575-5b91-4009-bf31-8289e94f3138	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	25000	2025-10-03	24a5fec6-cb61-4665-a39f-124af42f1ca8	2026-01-02 12:34:56.966811	2026-01-02 12:34:56.966811
dcc1d756-e43d-4dd1-b19a-256d1478b138	39f350e5-58fd-402e-955b-612f29624236	100000	2025-10-08	b37c5408-c197-48b0-aee6-8aa1b0a1b848	2026-01-02 12:34:57.021364	2026-01-02 12:34:57.021364
f63021ea-2803-4a86-98a5-41f0be9ef681	a7edf71d-c062-4f95-9e3c-d8bc8c532983	85000	2025-10-09	13b633d6-5e22-4b0b-b38d-29dc57256fdd	2026-01-02 12:34:56.994629	2026-01-02 12:34:56.994629
256f14b9-98a4-478e-b287-41e7455c93dc	39f350e5-58fd-402e-955b-612f29624236	70000	2025-10-21	c4f2d02a-e306-4da4-9b71-42611920e582	2026-01-02 12:34:57.021971	2026-01-02 12:34:57.021971
d308ee8b-0082-41a0-85e5-2d2b9a9bc092	f249b0de-1fa6-4027-baa2-89f04b0f24ca	135000	2025-11-13	b8e11d0e-f4c5-4706-9912-a2486e64b73a	2026-01-02 12:34:57.06448	2026-01-02 12:34:57.06448
1c342784-7292-4322-8f3c-41c08893a750	9ba263d4-9d99-404b-9f47-109fc4fa4296	300000	2025-12-03	24f17adf-9ae2-462f-a1f7-7839e9fd9323	2026-01-02 12:34:57.10441	2026-01-02 12:34:57.10441
809a1bde-faa2-4ae9-abe1-66b037bc273c	9ba263d4-9d99-404b-9f47-109fc4fa4296	66000	2025-12-04	fee765d7-04a1-4dc0-bd70-7a709f67ad13	2026-01-02 12:34:57.105092	2026-01-02 12:34:57.105092
27a9b23f-6438-4723-a21e-45e467e0d597	ea74d278-b4c1-4f03-9ae9-426764acce85	50000	2025-07-09	c2bb70eb-8123-4d66-ad68-d6e57c4cbeca	2026-01-02 12:34:56.842607	2026-01-02 12:34:56.842607
e06d66bd-dafd-4c04-9a11-767f59269142	ea74d278-b4c1-4f03-9ae9-426764acce85	120000	2025-07-24	507671f3-b69c-4bb9-abd0-f0c7437de1d0	2026-01-02 12:34:56.843231	2026-01-02 12:34:56.843231
3fa72c0a-04e7-464e-abd1-62b0b5f155b6	70834d5a-77e2-46bb-aaad-6878642480db	632500	2025-08-05	9c8d3d54-9ddd-47a8-81df-4ef83122c8d4	2026-01-02 12:34:56.885048	2026-01-02 12:34:56.885048
63a9bfca-1db9-436b-ba4e-7af56a173b05	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	215000	2025-08-21	34e53834-5d76-42b6-8d62-1a6094375956	2026-01-02 12:34:56.921037	2026-01-02 12:34:56.921037
99676fcf-8f3a-420c-91cb-11fd7cbdbce8	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	166650	2025-09-04	14ef9b74-cd5e-41cd-92e7-949b92358b11	2026-01-02 12:34:56.930813	2026-01-02 12:34:56.930813
9d9197a6-036b-47c7-8f18-46501557284b	2c4ff727-51a4-4814-b167-ede3ea556e77	316250	2025-09-04	db318b8f-0347-4645-a6a9-397563058969	2026-01-02 12:34:56.947566	2026-01-02 12:34:56.947566
b7c62fbe-9cf1-4ad0-8c9d-599d886b3b7f	af77b699-a683-496f-9a9e-61a7dca30b3d	340000	2025-09-09	dd6be0c5-3c28-43ac-8884-28f5bc9de75d	2026-01-02 12:34:56.95647	2026-01-02 12:34:56.95647
8350c910-2f19-4100-b6ac-f4f3815c5684	d23c367d-7648-4f2e-bb88-775552ead5a9	245036	2025-09-16	15b70560-2a4b-407b-b0c5-1bc8a68d036d	2026-01-02 12:34:56.988898	2026-01-02 12:34:56.988898
e1bec778-def2-4b4e-88a0-431a07813b1a	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	166650	2025-09-23	1d9394c3-daf4-4f40-94e0-4f4dd269d8e7	2026-01-02 12:34:56.931617	2026-01-02 12:34:56.931617
2afb6b8e-89bb-4f78-bc91-3d4e9d4e1f32	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	190000	2025-09-26	1dcdb12d-fcef-4cf6-8251-5e1f58ee3890	2026-01-02 12:34:57.005224	2026-01-02 12:34:57.005224
d5cfe651-acfa-4b00-8d53-30d027d711f6	ea74d278-b4c1-4f03-9ae9-426764acce85	70000	2025-09-29	fb5191d8-f6b8-4d06-bb4e-32d2a04affc1	2026-01-02 12:34:56.843867	2026-01-02 12:34:56.843867
7520f241-0077-494c-aa2a-5406201298cc	d5fb1006-decb-4956-9088-ab2b73b962cf	240790	2025-09-29	8c82dda9-14a3-4d8e-ae1d-6c17d8b462f7	2026-01-02 12:34:57.014662	2026-01-02 12:34:57.014662
6ca115c3-406d-4660-ab97-bde834016aff	af77b699-a683-496f-9a9e-61a7dca30b3d	269000	2025-09-29	3f20ab82-1143-4cd6-98a2-14428b131257	2026-01-02 12:34:56.955911	2026-01-02 12:34:56.955911
18801781-c424-4a38-9994-1ea3086eaaf4	2c4ff727-51a4-4814-b167-ede3ea556e77	316200	2025-10-08	0c7e9632-f273-434f-9296-fcaa8b4e7873	2026-01-02 12:34:56.94846	2026-01-02 12:34:56.94846
75c6d351-f9e0-40fb-80c5-ac25f5613e95	0110152b-bd06-466b-9247-36b3b0f779da	283630	2025-10-10	4fa85a84-b9f5-43c1-834c-58c25b25c609	2026-01-02 12:34:57.03111	2026-01-02 12:34:57.03111
49190712-a719-4b19-9848-074fff1ae99f	d5fb1006-decb-4956-9088-ab2b73b962cf	130000	2025-10-13	b3a68bd4-3db9-4f65-84f7-5370f78144be	2026-01-02 12:34:57.015428	2026-01-02 12:34:57.015428
d1ce80f4-8dd4-4d8b-9304-2569672aeb4a	d5fb1006-decb-4956-9088-ab2b73b962cf	147900	2025-10-14	20cb2d92-646e-4ed6-8494-6f4a16421dfe	2026-01-02 12:34:57.016109	2026-01-02 12:34:57.016109
3819c092-cf30-42b8-a714-145f41acd9ad	8e3d7051-cec0-42f3-b5f8-0130e93af56f	286000	2025-10-15	023bae4d-54e6-42a5-9e82-3d8814c9c753	2026-01-02 12:34:57.041751	2026-01-02 12:34:57.041751
cc140b5e-2e75-4c68-a9c0-7f2a177a55ae	75813c8c-88d2-45e7-b996-ed9181abb268	55000	2025-10-17	edec4c73-ce39-42c1-a4bc-65cd057da2f6	2026-01-02 12:34:57.046551	2026-01-02 12:34:57.046551
ca4c8808-4462-41d2-b533-465dbd7e8c88	4e96cf11-e67e-42d4-8096-c604e7b041be	143000	2025-10-20	ee9438fb-09cc-4ebc-a1a3-42e5157a773c	2026-01-02 12:34:57.051169	2026-01-02 12:34:57.051169
bb6d650b-8ff3-485e-9276-9d54081f9c24	76a4a8c5-3e73-47b9-9416-030909165ed7	226600	2025-10-21	7cfbe7aa-3cdf-476c-8bbe-2b804b606c9b	2026-01-02 12:34:57.05559	2026-01-02 12:34:57.05559
a3f765a1-715f-4fd6-8aa5-515a30efee58	0110152b-bd06-466b-9247-36b3b0f779da	283630	2025-10-27	7e10f081-6c1b-4230-bf91-4bfb59caffe2	2026-01-02 12:34:57.031877	2026-01-02 12:34:57.031877
d2b65c17-2019-4afa-b53a-0b675e6796de	f249b0de-1fa6-4027-baa2-89f04b0f24ca	125000	2025-10-28	4ae4407d-1aaa-4fbf-9868-f091137f4c7e	2026-01-02 12:34:57.063776	2026-01-02 12:34:57.063776
69e2090e-2728-4ec9-a345-e98243648b04	5926aae8-5ce2-4eec-a611-95aba3caaeab	192500	2025-10-30	cbc9e1fb-0995-4ca1-95e7-29094716c4a8	2026-01-02 12:34:57.069644	2026-01-02 12:34:57.069644
b56bfd29-8ae7-4082-b647-4c13769ee8de	dcfd3c37-2606-44c1-b09d-c20b854b8a44	45000	2025-11-04	d5570a44-6eb2-4d0e-b157-ccbe42481b69	2026-01-02 12:34:57.080362	2026-01-02 12:34:57.080362
534c54c7-5fb9-4189-92a0-832b2b76afe9	e8c28b1b-e446-40b6-8a36-2d7934e193b4	184800	2025-11-06	1d08e51d-363d-4ae5-b30e-efa74fd3ef1f	2026-01-02 12:34:57.089894	2026-01-02 12:34:57.089894
1bcb57b8-9ad9-402b-8075-2615ab7fc1c4	2461e6fc-ac29-463d-acdf-2a9dcca8607f	65000	2025-11-07	0f5c1bb6-fbf9-417e-9947-29eba5f3e1d0	2026-01-02 12:34:57.075299	2026-01-02 12:34:57.075299
8984f358-9a77-41db-a05d-c3b167be42ba	9ba263d4-9d99-404b-9f47-109fc4fa4296	30000	2025-11-10	85da5b1c-54cf-4dfd-81d8-b8e4bb8481cd	2026-01-02 12:34:57.103583	2026-01-02 12:34:57.103583
73336f0a-0412-465d-998d-855cf7b600e0	37d5a717-f470-43b3-9bbc-4113e9d171e0	93500	2025-11-10	e8b5d108-06c8-44ee-876b-d48011f73357	2026-01-02 12:34:57.119265	2026-01-02 12:34:57.119265
1ca895e8-b57a-4e71-b384-a0d9ec0a0bd0	b9b032f8-091d-41b3-8064-b2e6673a7609	162250	2025-11-11	299a24ed-7dca-460b-b034-730622829e73	2026-01-02 12:34:57.123672	2026-01-02 12:34:57.123672
08497db3-3723-4eeb-9d35-7472aa44e49a	005c1242-89c9-4d64-b11d-5d983b4735a8	93500	2025-11-11	905e3e45-bfcc-419e-a1f1-a929395c4513	2026-01-02 12:34:57.130462	2026-01-02 12:34:57.130462
1fc3177d-6d71-4762-92ef-9a193d738a13	e8c28b1b-e446-40b6-8a36-2d7934e193b4	184800	2025-11-12	fb02b090-107d-4bac-b917-f8f99b7b0cd7	2026-01-02 12:34:57.090461	2026-01-02 12:34:57.090461
92f7ed54-7603-4384-a842-8c17d077379e	76a4a8c5-3e73-47b9-9416-030909165ed7	226600	2025-11-12	fb757f38-dd7d-4f57-8310-2977303c1a1a	2026-01-02 12:34:57.056127	2026-01-02 12:34:57.056127
82a512d1-fed5-47b7-a281-07a9d3876f9d	005c1242-89c9-4d64-b11d-5d983b4735a8	93500	2025-11-14	050ca4bd-12c7-4677-81b3-a8b22c469d96	2026-01-02 12:34:57.131199	2026-01-02 12:34:57.131199
87749d5a-8d9f-488c-9b65-c054481ab977	5926aae8-5ce2-4eec-a611-95aba3caaeab	192500	2025-11-19	e375aab6-9315-4ead-aa4b-d0000d5ec03d	2026-01-02 12:34:57.070488	2026-01-02 12:34:57.070488
6d6a78fc-f413-4288-9f40-bf558b9508ae	2f469e47-c8ad-4a4d-a972-b089b6824fab	60000	2025-11-21	3026fdbe-c94a-4a75-97ac-1c90e1088b65	2026-01-02 12:34:57.135402	2026-01-02 12:34:57.135402
cf0db0d8-4ec4-4877-8a74-be68ce8d1a02	a7edf71d-c062-4f95-9e3c-d8bc8c532983	-55000	2025-10-13	7bc586ed-475d-4db1-aaba-656044d19dea	2026-01-02 12:34:56.997029	2026-01-02 12:34:56.997029
3f59ef93-5940-44e3-959a-346162811780	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	121000	2025-11-25	9640793d-4308-4ca2-b85a-d3b7ddb25000	2026-01-02 12:34:57.148615	2026-01-02 12:34:57.148615
3c53e25d-780e-4adc-8988-83bbb5ad46da	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	126500	2025-11-26	4ae9f3ba-0213-4120-b45d-61bb9a22dee8	2026-01-02 12:34:57.154434	2026-01-02 12:34:57.154434
8d12238f-588b-46a7-a227-e36807eb714e	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	126500	2025-11-27	0a7d82e4-7167-4a9c-b0b4-238478f8a94a	2026-01-02 12:34:57.154939	2026-01-02 12:34:57.154939
901e3059-1b2f-46a9-9fb5-37c525b05f6f	1d8af109-85f2-4ab0-8f4c-b5717cf8e0f8	-60500	2025-09-25	ac3262f4-70cb-42cb-b43a-f248a926d604	2026-01-02 12:34:56.983153	2026-01-02 12:34:56.983153
78d8e781-e7c0-4482-8f4f-ab67c805c401	02a755e1-a5cb-4b07-9a24-d9528b1374d0	858000	2025-12-01	6dd3dcd2-de99-4d9c-aad4-f3baeb2b52c1	2026-01-02 12:34:57.139994	2026-01-02 12:34:57.139994
73c7369a-d4b9-4c0e-9242-67bb4486cb4b	9ba263d4-9d99-404b-9f47-109fc4fa4296	50000	2025-11-29	cd8f975b-d6f3-4d92-81a4-9a74f2841246	2026-01-02 12:34:57.105748	2026-01-02 12:34:57.105748
139443f0-c295-4931-a253-0ca458d3d811	005c1242-89c9-4d64-b11d-5d983b4735a8	46750	2025-12-03	e803f9b2-5b9b-4afa-81cd-db73e674f6fb	2026-01-02 12:34:57.131835	2026-01-02 12:34:57.131835
f32b29f0-2ffe-4fae-b086-87791a066c75	e8c28b1b-e446-40b6-8a36-2d7934e193b4	137500	2025-12-10	418600ec-4241-45da-92f3-845b8fdb7c2f	2026-01-02 12:34:57.091049	2026-01-02 12:34:57.091049
66d93590-c71b-4634-86e8-87104043d00b	b9b032f8-091d-41b3-8064-b2e6673a7609	-141250	2025-11-27	69154ea5-d2a6-479c-b8e3-3c057f24188c	2026-01-02 12:34:57.124636	2026-01-02 12:34:57.124636
4de8bae3-4347-41f1-b718-f0914d426ab2	37d5a717-f470-43b3-9bbc-4113e9d171e0	-93500	2025-11-20	911fa676-a4bc-47c9-9023-11e3463b0c60	2026-01-02 12:34:57.12012	2026-01-02 12:34:57.12012
c5de5d00-aaa7-4da2-9444-064fc46de6ac	42681f0f-6c97-4d1a-ab16-afc072737570	52250	2025-08-19	fb4300bc-ea70-4998-943a-ad08645f9a6a	2026-01-04 04:28:37.476232	2026-01-04 04:28:37.476232
c23a581c-4df2-47d4-8a71-551cc35a84e0	42681f0f-6c97-4d1a-ab16-afc072737570	46750	2025-09-05	9a6f9041-4a05-4bfd-b5cf-b47256430902	2026-01-04 04:28:53.053433	2026-01-04 04:28:53.053433
44d49744-c91b-4199-97ed-311950c4d0da	42681f0f-6c97-4d1a-ab16-afc072737570	5500	2025-08-19	\N	2026-01-02 12:34:56.904071	2026-01-02 12:34:56.904071
18fdff5e-a754-4716-a5d9-c6a164cc29c6	c54b137c-8ed7-425c-a408-80272ba1c953	195900	2025-07-16	\N	2026-01-04 05:01:02.734985	2026-01-04 05:01:02.734985
eb6a9316-b92b-4e2a-94f6-ed3c81a52d07	c54b137c-8ed7-425c-a408-80272ba1c953	92950	2025-07-10	e39dd069-00b5-4653-a8ea-9718ae7b567d	2026-01-04 05:00:09.915147	2026-01-04 05:00:09.915147
d97784d4-be48-4133-88f8-4453e2a0fa13	c54b137c-8ed7-425c-a408-80272ba1c953	82950	2025-07-16	f4696924-a670-451c-b976-9d278e0a7cef	2026-01-04 05:00:26.449544	2026-01-04 05:00:26.449544
37abd564-aab3-4224-85bf-4235ed61e857	49cd8378-4481-4c2d-9e9e-268241211306	66500	2025-07-07	eb29fb65-81e3-42a5-8c17-12acd603d498	2026-01-04 05:11:34.344282	2026-01-04 05:11:34.344282
d051f5ef-4e5b-4281-8e59-725db3586832	7b4689a1-e4cd-479a-bab9-802def112c4e	62675	2025-05-28	\N	2026-01-02 12:34:56.82642	2026-01-02 12:34:56.82642
a242bbd9-59c6-4694-b5eb-31c3f53819df	690b704e-00f1-4669-ba84-0313730faf10	88000	2025-07-24	\N	2026-01-02 12:34:56.860367	2026-01-02 12:34:56.860367
029d33eb-d562-4ef9-a9f8-6562b6bf74fe	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	66000	2025-07-28	\N	2026-01-02 12:34:56.865915	2026-01-02 12:34:56.865915
eac08450-4cf0-4f34-80ea-44b37481e15c	76a97d96-3b40-4c24-bfbe-e16362c59574	115500	2025-08-07	\N	2026-01-02 12:34:56.898887	2026-01-02 12:34:56.898887
c253c63a-4b3b-41bb-9527-c4bbf2acf548	b4c26b44-88bc-4194-a735-7c45a3e9a497	150000	2025-09-03	85f5fc16-3f05-423d-a5ed-0c0ee50c6956	2026-01-02 12:34:56.893547	2026-01-02 12:34:56.893547
7261e0d9-5aa3-4ee9-ae42-2e69e34a92b5	1d8af109-85f2-4ab0-8f4c-b5717cf8e0f8	49500	2025-09-15	71da7a9f-e797-406a-9421-659b1a17c1e5	2026-01-02 12:34:56.982208	2026-01-02 12:34:56.982208
1c994e16-75ba-4796-8a76-9e913cb9e5fc	b6320ca9-8b3a-4451-8118-1b6b0544f986	121000	2025-10-10	394caa52-18cd-45a1-a2cb-a442906c2064	2026-01-02 12:34:57.026113	2026-01-02 12:34:57.026113
9b85adf6-d2a7-4ffe-aaa7-301395ca78b2	4e96cf11-e67e-42d4-8096-c604e7b041be	143000	2025-11-10	0ba82318-ff55-42d7-b815-9c0fbe6b33b8	2026-01-02 12:34:57.05199	2026-01-02 12:34:57.05199
a2e336f9-bd63-4d1a-8119-604d3865c314	49cd8378-4481-4c2d-9e9e-268241211306	76500	2025-07-02	\N	2026-01-02 12:34:56.790767	2026-01-02 12:34:56.790767
6e7a131e-331c-4434-904a-6ee203679d43	7b4689a1-e4cd-479a-bab9-802def112c4e	34550	2025-07-22	3211806c-ed70-4387-b24f-0002caeade40	2026-01-04 05:47:11.851294	2026-01-04 05:47:11.851294
d7088db1-54ea-4987-9ba9-3ea032c7d4d4	7b4689a1-e4cd-479a-bab9-802def112c4e	77275	2025-08-07	e918313e-a120-40e7-91b1-7f869001dee7	2026-01-04 05:47:21.577723	2026-01-04 05:47:21.577723
b4a8e1a8-ae2b-471b-8c9e-790dc89d16d7	ea74d278-b4c1-4f03-9ae9-426764acce85	50000	2025-07-17	b66ceed2-a3b2-4709-a5d8-8871997075af	2026-01-04 10:11:34.648916	2026-01-04 10:11:34.648916
0fe2ede7-4366-4f62-af2e-6cd8b4e48714	690b704e-00f1-4669-ba84-0313730faf10	280500	2025-07-18	58d2797f-8ded-4404-9049-48c0f4421bbd	2026-01-04 10:37:56.719754	2026-01-04 10:37:56.719754
0918f79f-1ff6-46f5-9c15-e2559dcba0fb	690b704e-00f1-4669-ba84-0313730faf10	187000	2025-08-04	a10d08fb-e9a8-4847-9a77-8c9cc8d4357c	2026-01-04 10:38:11.504749	2026-01-04 10:38:11.504749
dc0d151d-9707-4250-bd4d-f9bb4558c07c	690b704e-00f1-4669-ba84-0313730faf10	80000	2025-09-02	6ef6d2e7-deaf-4591-8526-b521ed30a490	2026-01-04 10:38:25.468807	2026-01-04 10:38:25.468807
644d14f9-5dcd-4ea1-b2bc-82ef99323fcf	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	66000	2025-07-25	851ce34a-8af1-46e5-bb06-e9f848cd3608	2026-01-04 17:58:11.849475	2026-01-04 17:58:11.849475
89c7ef06-ba22-4900-ae99-bc5ba73a5bdd	b4c26b44-88bc-4194-a735-7c45a3e9a497	305250	2025-08-05	4dc6b6e9-0f43-4304-980c-4dbb9241f6ef	2026-01-04 18:37:21.117288	2026-01-04 18:37:21.117288
17ba1733-0fa8-41b2-9718-b6ed6b12f757	b4c26b44-88bc-4194-a735-7c45a3e9a497	155250	2025-09-17	5fd9d476-4415-46eb-9bb9-4a62b0e51360	2026-01-04 18:37:50.833234	2026-01-04 18:37:50.833234
151a4449-abff-43c8-8f8b-232da552c81c	76a97d96-3b40-4c24-bfbe-e16362c59574	192500	2025-08-07	5a7bcbb0-3567-4b23-a112-24fff48296df	2026-01-04 18:40:46.237698	2026-01-04 18:40:46.237698
627fd0f4-7247-467a-af78-0ba5e2092261	35e96736-2752-4b0d-a07e-c25dc5b3c572	110000	2025-09-24	290c854b-69b2-4d99-b4ed-6c07fd972c27	2026-01-02 12:34:56.963303	2026-01-02 12:34:56.963303
271e2c0c-8a12-4ef3-84b8-9875d4fcba71	1d8af109-85f2-4ab0-8f4c-b5717cf8e0f8	11000	2025-09-15	deacdddd-a865-4416-92b0-eb14ab34ad0f	2026-01-05 02:42:26.666046	2026-01-05 02:42:26.666046
b867eec1-bd54-482c-83ed-bd087dd33bdd	e8c28b1b-e446-40b6-8a36-2d7934e193b4	108900	2025-12-15	197814ab-a422-4e95-8563-5c07538addee	2026-01-25 00:54:21.491787	2026-01-25 00:54:21.491787
6211577a-b89f-43aa-b853-881f1f863767	02a755e1-a5cb-4b07-9a24-d9528b1374d0	3003000	2025-12-19	8ab1a66b-c4a8-4e7d-9b6f-2b8f63436ab6	2026-01-25 01:06:00.153387	2026-01-25 01:06:00.153387
a7129596-a2c5-4ac8-abbb-dd4de9350cbf	39f350e5-58fd-402e-955b-612f29624236	-85000	2026-01-05	fc10893c-d8b1-49bf-a28d-46797518367f	2026-01-25 01:23:54.73025	2026-01-25 01:23:54.73025
b087ea0b-dfa8-42bb-98ad-5e4a9e39b444	a6388f4f-02bf-49e0-9b74-d51628ac7b05	176000	2026-01-05	2958d5dc-8792-4612-8d3b-64d8f19f99dc	2026-01-25 01:28:51.194007	2026-01-25 01:28:51.194007
648408e8-40c0-4197-877a-ceeb4b35f465	02a755e1-a5cb-4b07-9a24-d9528b1374d0	3003000	2026-01-07	91f7880c-6dda-4361-974b-b800d3ce708c	2026-01-25 01:32:45.147298	2026-01-25 01:32:45.147298
1365dc91-32c6-4dd3-8e43-37551661a64f	eb21b41a-8be0-4a8e-9880-e5987ca12a44	235400	2026-01-07	b9ccd642-40c6-465a-984e-bc1ba2a466ad	2026-01-25 01:38:01.359428	2026-01-25 01:38:01.359428
\.


--
-- Data for Name: project_supplies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_supplies (id, project_id, name, quantity, unit_price, reconciliation_id, created_at, updated_at) FROM stdin;
9870cf88-57b9-48a2-b9ee-2effefa0e128	9757617a-6853-459d-bd33-4feac0b3c5b9	Hinged door	1	100000	\N	2026-01-02 12:34:56.747721	2026-01-02 12:34:56.747721
f6e8970a-be2f-4be4-afc5-902b6593503c	9757617a-6853-459d-bd33-4feac0b3c5b9	Plasterboard	1	2408	\N	2026-01-02 12:34:56.75063	2026-01-02 12:34:56.75063
12851b18-4be2-4bdd-b8a1-320fef998222	9757617a-6853-459d-bd33-4feac0b3c5b9	Packers	1	4147	\N	2026-01-02 12:34:56.753947	2026-01-02 12:34:56.753947
7d308449-ce43-4517-86b7-0d654f36f2d6	9757617a-6853-459d-bd33-4feac0b3c5b9	Brad nail	1	2180	\N	2026-01-02 12:34:56.755598	2026-01-02 12:34:56.755598
4976fdae-77bf-4bf6-8380-dce3ab818a64	9757617a-6853-459d-bd33-4feac0b3c5b9	Bracket angle	1	262	\N	2026-01-02 12:34:56.758549	2026-01-02 12:34:56.758549
e8b34b2e-e913-4db3-8991-7beea1f0f06f	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Timbers	1	3300	\N	2026-01-02 12:34:56.81161	2026-01-02 12:34:56.81161
e50bba9e-7228-4247-85b4-9b25d8a5e76e	7b4689a1-e4cd-479a-bab9-802def112c4e	Cover plates	1	12800	\N	2026-01-02 12:34:56.824482	2026-01-02 12:34:56.824482
7a18e385-bcd2-463a-afd2-ff4cb14a0d30	42681f0f-6c97-4d1a-ab16-afc072737570	Hung window	1	26300	\N	2026-01-02 12:34:56.902384	2026-01-02 12:34:56.902384
3c7f76f8-77c7-42a4-a47f-e03bcaf03fee	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	Bracket angles and pine structural	1	10116	\N	2026-01-02 12:34:57.001559	2026-01-02 12:34:57.001559
8e2b9ec4-873a-4457-8774-73fee84108b7	a7edf71d-c062-4f95-9e3c-d8bc8c532983	Flashings	1	24883	1afa8e2a-8484-4c78-ab0b-b6a459c88715	2026-01-02 12:34:56.992332	2026-01-02 12:34:56.992332
754463dc-8e27-42a1-810f-89332863d7fb	690b704e-00f1-4669-ba84-0313730faf10	Stackable door	1	275000	495c73f2-0f05-4ed7-b811-5baccfce8e1b	2026-01-02 12:34:56.846509	2026-01-02 12:34:56.846509
056b5abc-ccf2-44f9-9c68-cfd5ac981531	6c6d6afd-4ab9-4111-b7eb-c67065c146ee	Aluminum materials	1	12234	2a048461-a331-4843-93e9-b6cc65639f32	2026-01-02 12:34:56.863632	2026-01-02 12:34:56.863632
fa3b306d-d0a0-4e7e-a240-a9234eb43298	b4c26b44-88bc-4194-a735-7c45a3e9a497	Sliding doors	1	300000	521bff24-2657-488c-8ba5-17840d4002be	2026-01-02 12:34:56.888474	2026-01-02 12:34:56.888474
2353bd55-b39f-4cfb-a344-b7282869860d	76a97d96-3b40-4c24-bfbe-e16362c59574	Gyprock	1	2138	3d168ef1-cc05-47a4-abb2-50234c1cda79	2026-01-02 12:34:56.897664	2026-01-02 12:34:56.897664
3250d4e2-f99d-4bc7-ac5c-82a6b2f61ee5	70834d5a-77e2-46bb-aaad-6878642480db	Bifold with retractable fly screen	1	517000	8aa12946-0728-40cb-b2bf-d10ee5f39813	2026-01-02 12:34:56.869364	2026-01-02 12:34:56.869364
d244274e-a0d2-421e-8e07-a5b351de2328	690b704e-00f1-4669-ba84-0313730faf10	50x50 Angle	1	2750	68ad68a8-ea04-40e6-9c45-e88df869bca7	2026-01-02 12:34:56.848575	2026-01-02 12:34:56.848575
6a462ed1-c8c8-45c2-bfb8-cae691778876	70834d5a-77e2-46bb-aaad-6878642480db	Cover sheet and bbes	1	9043	9ccb7596-6e4a-4752-8e36-653503ec02d1	2026-01-02 12:34:56.871471	2026-01-02 12:34:56.871471
a5e66c35-07cb-4ed4-bbdc-127c8849a7f5	70834d5a-77e2-46bb-aaad-6878642480db	Pine structural	1	14086	9d743441-911a-4daa-8c8f-04b7d8d627a0	2026-01-02 12:34:56.872525	2026-01-02 12:34:56.872525
b86e93ff-aef3-482e-b887-fb2286cdb905	70834d5a-77e2-46bb-aaad-6878642480db	Lintel	1	24320	4351a3c8-8966-4b12-9688-bb1182a89047	2026-01-02 12:34:56.873408	2026-01-02 12:34:56.873408
96796430-c93e-47f0-9d47-fde2268d6e66	70834d5a-77e2-46bb-aaad-6878642480db	Pine post h4	1	2945	6e07b42f-bf2f-49d3-8ef4-09363def2df0	2026-01-02 12:34:56.874405	2026-01-02 12:34:56.874405
ed47ecb9-17a7-4ade-a277-2e38995f4bc5	70834d5a-77e2-46bb-aaad-6878642480db	Polly wood	1	12969	9064303f-b0d5-4f43-bc4a-2b0eec51781c	2026-01-02 12:34:56.875296	2026-01-02 12:34:56.875296
460b44c9-18ea-430e-b2f7-4243ae362bc3	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Double glaze windows	1	120000	f03dcab9-3403-42c2-a34b-cb6e94ca6653	2026-01-02 12:34:56.912977	2026-01-02 12:34:56.912977
28f00900-161f-49e4-a800-872a63acfca7	b4c26b44-88bc-4194-a735-7c45a3e9a497	Spray paint	1	4233	d3e563ae-2740-4dae-a2e4-19bf727fe354	2026-01-02 12:34:56.8894	2026-01-02 12:34:56.8894
4584ce4b-cb57-44ae-9465-67c09e1b4cee	2c4ff727-51a4-4814-b167-ede3ea556e77	Screws and spray	1	2851	1e1fd011-e5bd-4c80-a3e6-beb0d1d14fe4	2026-01-02 12:34:56.934628	2026-01-02 12:34:56.934628
a1236308-60aa-4dfd-bda1-62496002e1be	af77b699-a683-496f-9a9e-61a7dca30b3d	Double glaze sliding windows semi commercial	1	405350	777f612c-e9ff-4bfc-b3f2-e25e5ff180fd	2026-01-02 12:34:56.952644	2026-01-02 12:34:56.952644
45dccb70-2de8-450c-a0e0-983b9a4b9980	22ffc1e1-7406-4a07-9b5d-f212a9fd220e	Sliding and fixed windows walco aluminum	1	83911	348c9474-0df0-4e6e-b3da-7d2d82b41218	2026-01-02 12:34:56.923878	2026-01-02 12:34:56.923878
ba690e2a-66b9-451c-8326-74c5ac0303cc	2c4ff727-51a4-4814-b167-ede3ea556e77	Roller and sucktion cup	1	3464	8466a025-1c11-4d39-9fd3-471503fff011	2026-01-02 12:34:56.935583	2026-01-02 12:34:56.935583
1428c53b-3d0c-4141-a27f-df3490a6eb2e	d23c367d-7648-4f2e-bb88-775552ead5a9	Sliding windows	1	76010	014c6f0b-c80d-4fd2-947f-e4b11502fe1f	2026-01-02 12:34:56.986197	2026-01-02 12:34:56.986197
6a022a2c-cd80-4e03-a00a-ef3dcaa572f6	8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	Hinge door and hung window	1	196900	7be57c15-9948-45d4-9c75-0d1ea07a1334	2026-01-02 12:34:56.965782	2026-01-02 12:34:56.965782
1c1f9f03-aa5e-4ebf-99e9-0d6db73e9793	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Timbers	1	9834	d1ca9f32-c5d5-4494-992a-4dcbbcf16aa5	2026-01-02 12:34:56.91404	2026-01-02 12:34:56.91404
53a1bfc9-37b9-4623-99db-c9f5a280ba50	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Drill bits	1	4736	2b381a1e-b13f-4085-88e1-27151fb4ad5c	2026-01-02 12:34:56.914725	2026-01-02 12:34:56.914725
4582ce92-1ba7-48e0-af91-fc5c06447ad9	2c4ff727-51a4-4814-b167-ede3ea556e77	Skip bin	1	49000	1629ecc6-91d7-494d-8eb3-f1cdaef43cc0	2026-01-02 12:34:56.936708	2026-01-02 12:34:56.936708
9ed980cd-c7fa-4be8-9ee1-687e1d1a7a3b	a7edf71d-c062-4f95-9e3c-d8bc8c532983	Castment window	1	82830	90e978f9-8426-4108-96b5-35f68a7e8d5f	2026-01-02 12:34:56.991579	2026-01-02 12:34:56.991579
3d839f8f-b44d-460e-9bab-d6f0bd557656	d23c367d-7648-4f2e-bb88-775552ead5a9	Sliding windows	1	94820	b68f029c-dc5a-4538-8f22-0605fb9c0c6f	2026-01-02 12:34:56.987224	2026-01-02 12:34:56.987224
134f4f68-2a81-441a-bef9-798d36b1ebec	bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	Retractable flyscreen	1	137500	7dd10c8d-18fd-4446-ae13-736e9d01454d	2026-01-02 12:34:56.97174	2026-01-02 12:34:56.97174
49d82bb9-f339-4450-99b5-43e108cdd20e	d5fb1006-decb-4956-9088-ab2b73b962cf	Double glazed windows semi commercial	1	214500	abb7fae1-6b7c-4a17-8e94-7d7eb3de1438	2026-01-02 12:34:57.009007	2026-01-02 12:34:57.009007
d587b9d4-a448-4b66-9928-2491bc937aa2	70834d5a-77e2-46bb-aaad-6878642480db	Fasteners drive impact + bracket angles	1	2816	0854b95b-4c5c-4dcc-86a6-34e69feeb879	2026-01-02 12:34:56.876047	2026-01-02 12:34:56.876047
87c6b6a9-f124-41d9-8edd-3d4afa2e46c7	70834d5a-77e2-46bb-aaad-6878642480db	Screw bugle battern	1	3029	20779982-ba19-4a27-838f-be2e834fb197	2026-01-02 12:34:56.876692	2026-01-02 12:34:56.876692
79255143-bd65-4c0d-90e1-5b3c22660f37	39f350e5-58fd-402e-955b-612f29624236	Spirals	1	28460	3c08186a-5f2b-4258-a532-10fa4f590821	2026-01-02 12:34:57.019316	2026-01-02 12:34:57.019316
402f6616-43cd-44c7-8c8b-d193f3fa2bbf	b6320ca9-8b3a-4451-8118-1b6b0544f986	Duct tape + drop sheet	1	1291	547c321f-b5c7-435f-aeca-31f1acf09cee	2026-01-02 12:34:57.02421	2026-01-02 12:34:57.02421
1fc54f3a-a505-46a4-9af1-56d8fd9ec1b6	d5fb1006-decb-4956-9088-ab2b73b962cf	Silicon	1	1355	4e364c08-3658-4144-899f-1346bcfb9665	2026-01-02 12:34:57.010026	2026-01-02 12:34:57.010026
c7f8146d-601a-4b05-8a87-e4059aa67ce5	0110152b-bd06-466b-9247-36b3b0f779da	Stackable door	1	275000	227d65cc-8e5a-4c30-874e-8fd7b3814283	2026-01-02 12:34:57.029571	2026-01-02 12:34:57.029571
33e355e7-eaad-41df-8a82-a31b96009977	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Clothes	1	760	d49f0a6e-332c-4d96-ab4a-afab3d4cbaa4	2026-01-02 12:34:57.034993	2026-01-02 12:34:57.034993
fb375b46-1ee3-47c7-9a74-13a5621cf9c8	d5fb1006-decb-4956-9088-ab2b73b962cf	Drop sheet	1	4280	ccf0fb8b-7b7d-44d8-a8c6-49f8a53f9131	2026-01-02 12:34:57.010837	2026-01-02 12:34:57.010837
d3efb468-4a16-4e9a-8d5c-ff3848fdf2da	d5fb1006-decb-4956-9088-ab2b73b962cf	Foam filler	1	4800	779a9194-763b-4406-abf5-ed2b471abbe6	2026-01-02 12:34:57.013196	2026-01-02 12:34:57.013196
c8b3b964-8f78-48f7-9f5a-5ff4960f9c7b	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Flushings	1	4003	dbc46e41-f711-41d8-8d53-1b030d27d034	2026-01-02 12:34:57.035791	2026-01-02 12:34:57.035791
bdbfaad6-437e-4cb4-a96c-07e713dd02ee	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Angles	1	14681	2cb1ff2a-c338-44c8-92d4-c182fc920999	2026-01-02 12:34:57.036732	2026-01-02 12:34:57.036732
d8cfb984-3224-45cb-9bf7-8a78a50105ab	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Flashings	1	533	21c6f68a-ff51-458c-92b3-4af45adee6da	2026-01-02 12:34:57.037565	2026-01-02 12:34:57.037565
d0f30162-aa23-4dde-884b-b25e244da792	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Flashings	1	3756	0598e21f-3efa-4345-901f-db77ea234340	2026-01-02 12:34:57.038336	2026-01-02 12:34:57.038336
9dae346a-ff01-4ef6-b902-e474e5663426	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Insulation roll and pine dressed premium grade	1	13547	2cf70ef4-d7ee-42be-bb58-f45f0d85e2f1	2026-01-02 12:34:57.039726	2026-01-02 12:34:57.039726
f3f3f953-988b-4e2e-adf1-956fe3979ea8	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Fill-it, gap prefix, and roof gutter	1	11436	09b9743e-99ac-4449-9cd6-6af327e2be86	2026-01-02 12:34:57.040262	2026-01-02 12:34:57.040262
b8c0bc08-6a32-4a58-9f2d-9f6510ec6b71	af77b699-a683-496f-9a9e-61a7dca30b3d	Remake sliding window	1	45000	8c245be2-28d8-4d0b-8e09-c6af99509574	2026-01-02 12:34:56.954505	2026-01-02 12:34:56.954505
9618bb56-882f-4712-9cce-37a10acecfb6	0110152b-bd06-466b-9247-36b3b0f779da	pitt door	1	22000	512565f1-a49b-44bd-bb8d-fbd176bd2d7d	2026-01-02 12:34:57.030442	2026-01-02 12:34:57.030442
59a89f87-11d4-4dcd-8e6a-c211f86544f3	9757617a-6853-459d-bd33-4feac0b3c5b9	Pine structural	2	2700	\N	2026-01-02 12:34:56.752242	2026-01-02 12:34:56.752242
34e3d22a-30b9-4a35-9255-17179aa99fb3	9757617a-6853-459d-bd33-4feac0b3c5b9	Angle bracket	5	1915	\N	2026-01-02 12:34:56.757001	2026-01-02 12:34:56.757001
befb2d37-d58a-4ac5-9dad-50e4e4d54472	c54b137c-8ed7-425c-a408-80272ba1c953	Windows	2	50000	fc067429-fb0a-4b33-b1da-db28fc487872	2026-01-02 12:34:56.77287	2026-01-02 12:34:56.77287
9df6a173-fb1f-41d2-8210-27febc8a00ea	49cd8378-4481-4c2d-9e9e-268241211306	Windows	2	25437	\N	2026-01-02 12:34:56.786798	2026-01-02 12:34:56.786798
ae575b83-3263-44c2-b71e-a9cdadd99c91	c54b137c-8ed7-425c-a408-80272ba1c953	Angles	3	2000	47018676-a254-4016-a006-fee863fad4ef	2026-01-02 12:34:56.774244	2026-01-02 12:34:56.774244
4a71f37a-0d77-4a83-afb8-819d70964607	49cd8378-4481-4c2d-9e9e-268241211306	Timbers	2	4150	\N	2026-01-02 12:34:56.788185	2026-01-02 12:34:56.788185
4814b571-caef-461a-a5f6-f58f9818e38f	7b4689a1-e4cd-479a-bab9-802def112c4e	Cover plates	1	18267	ecb5d8f1-bec7-43fd-99b8-5263048d8e07	2026-01-02 12:34:56.823264	2026-01-02 12:34:56.823264
6fbb5e37-be73-4c46-a28c-d39e2ea86499	b999eb78-03af-4adc-84d6-1e0142d8d57a	Bifold hardware	1	30125	\N	2026-01-02 12:34:56.795533	2026-01-02 12:34:56.795533
f8747d4f-c34c-4764-9e83-1458c7acee2f	b999eb78-03af-4adc-84d6-1e0142d8d57a	Timber h3	2	3791	\N	2026-01-02 12:34:56.798785	2026-01-02 12:34:56.798785
4dccad41-ac53-4b23-ba56-3006d7fc9c4d	b999eb78-03af-4adc-84d6-1e0142d8d57a	Timber king stud	2	2400	\N	2026-01-02 12:34:56.797591	2026-01-02 12:34:56.797591
0a4e2676-5b2e-487e-aca6-629ad2a0f90d	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Foam	2	850	\N	2026-01-02 12:34:56.812866	2026-01-02 12:34:56.812866
99a1ad45-b999-48e7-93b6-8266a6e65a5c	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	197000	\N	2026-01-02 12:34:56.810198	2026-01-02 12:34:56.810198
0524a4eb-c735-4f1e-a619-97beb00f5691	76a97d96-3b40-4c24-bfbe-e16362c59574	Roller door	1	80000	\N	2026-01-02 12:34:56.897056	2026-01-02 12:34:56.897056
32e4d189-b947-4fc7-9e51-0489ef778a0b	35e96736-2752-4b0d-a07e-c25dc5b3c572	Bifold window	1	110000	1e7a80b7-6411-49d2-8c4b-a055f4453bd7	2026-01-02 12:34:56.959546	2026-01-02 12:34:56.959546
e7cbba32-4882-4b24-b976-3ba86622d690	02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	Angles	1	9000	3b2c0763-5991-4246-aa96-14a042078e0c	2026-01-02 12:34:56.915626	2026-01-02 12:34:56.915626
479b12f5-b7a2-4eb9-bc4f-9725a7f555e3	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Packers	1	5350	ed5d7da6-f4e8-4ec0-9de3-09f5f6a5646c	2026-01-02 12:34:57.0847	2026-01-02 12:34:57.0847
03ce3fa6-eb98-4f6b-80bc-eefde4665a6a	690b704e-00f1-4669-ba84-0313730faf10	Spray & Sika flex & Screwdriver	1	4086	84a2cd26-f45c-47ee-ac16-f212c1098d96	2026-01-02 12:34:56.847141	2026-01-02 12:34:56.847141
7daa4b87-266c-422d-aa43-87f43650f980	690b704e-00f1-4669-ba84-0313730faf10	Wedge set trojan, wrench riggers trojan, caulking gun dripless, sika white sikaflex, combination spanner trojan combination spanner trojan, miracle cleaning paste shim packing titan brown, ruler stell lfkin, shim packing titan green shim packing titan black	1	21403	49e633d3-ec46-43b2-8d47-cef613435391	2026-01-02 12:34:56.847745	2026-01-02 12:34:56.847745
67239546-fbc3-40c1-a9ec-dbe5e62b9336	af77b699-a683-496f-9a9e-61a7dca30b3d	Pine primed dar fj	1	21336	8285fee7-aeed-4a98-8e5f-dc5e3b84b89b	2026-01-02 12:34:56.953727	2026-01-02 12:34:56.953727
61cb4c29-6446-4005-876a-903757c8697b	a7edf71d-c062-4f95-9e3c-d8bc8c532983	Plaster patch	1	2582	b939f23d-1e6a-44bd-85ea-da780e080f49	2026-01-02 12:34:56.992982	2026-01-02 12:34:56.992982
f5c3d18f-01b2-4b0a-b5ca-0071ced18120	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	Sticky tapes	1	1872	43ec3dd4-27da-4ff4-a997-121935e181e2	2026-01-02 12:34:57.002195	2026-01-02 12:34:57.002195
3d4bcc27-2961-4d6f-8881-d47bf39d392b	75813c8c-88d2-45e7-b996-ed9181abb268	Angles	1	7000	48257ddd-7c87-40cf-b431-e9b9cbb9cc3e	2026-01-02 12:34:57.044911	2026-01-02 12:34:57.044911
3cde5a81-449e-4cfe-a1a5-ffd1fd592f1d	8e3d7051-cec0-42f3-b5f8-0130e93af56f	Foam, silicon, and scrapers	1	7488	f0ade6bc-e2e2-4672-a83d-b5b1818967b8	2026-01-02 12:34:57.039122	2026-01-02 12:34:57.039122
bae6a346-f812-4f49-abbc-b014836f91a3	76a4a8c5-3e73-47b9-9416-030909165ed7	Sliding doors	1	238700	7f46b2d8-71bb-4daf-a23f-214f0f94e692	2026-01-02 12:34:57.054257	2026-01-02 12:34:57.054257
cbb3ec60-b252-4047-96d6-43ef0bcb4342	2461e6fc-ac29-463d-acdf-2a9dcca8607f	Plastic angles	1	935	8d54f96f-09c5-4575-87c3-16f4c0baf053	2026-01-02 12:34:57.07319	2026-01-02 12:34:57.07319
b294a9b3-0a83-49a0-9828-bbfb342e9c6c	2461e6fc-ac29-463d-acdf-2a9dcca8607f	Flyscreen net	1	16445	c78ffe28-e7d4-4273-b855-ef0b490c95b9	2026-01-02 12:34:57.073845	2026-01-02 12:34:57.073845
33d5f213-cd40-49bf-9b8a-1ccd56224fbd	2461e6fc-ac29-463d-acdf-2a9dcca8607f	Flyscreen frame	1	20031	dd42006a-edf7-4066-8a2c-ddae16efe3fa	2026-01-02 12:34:57.074485	2026-01-02 12:34:57.074485
31d9581c-b0d8-48e8-81f8-b6d3f0f60bca	4e96cf11-e67e-42d4-8096-c604e7b041be	Retractable flyscreen	1	50600	26da11bc-19af-4ddb-be5b-dd2c3e098da5	2026-01-02 12:34:57.049331	2026-01-02 12:34:57.049331
e222178b-fdf6-4085-9f4f-cfe5a8d4230f	5926aae8-5ce2-4eec-a611-95aba3caaeab	Sliding windows	1	154000	426ab24b-d9ff-4ff7-a738-757d9c7be109	2026-01-02 12:34:57.068005	2026-01-02 12:34:57.068005
feef4ea8-bd30-4b14-8fc2-b1baf0ebee99	f249b0de-1fa6-4027-baa2-89f04b0f24ca	Sliding windows	1	93500	5156d497-f3c4-4655-bc23-a98645ff2082	2026-01-02 12:34:57.061346	2026-01-02 12:34:57.061346
3ee8d72b-e55d-4907-abae-7f229911138a	dcfd3c37-2606-44c1-b09d-c20b854b8a44	Hinge door and sliding windows	1	216150	886a58f7-48b3-4319-b505-da2c2cf34f4e	2026-01-02 12:34:57.079476	2026-01-02 12:34:57.079476
0c521ded-d300-43a3-8008-5fc894f8bced	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Packer window	1	5064	a16aebe4-84dd-42ad-846e-52d64e6be73f	2026-01-02 12:34:57.082836	2026-01-02 12:34:57.082836
fbe1d333-dfc4-4aa5-91e3-cfc7dca21f48	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Screws	1	10355	d335ecc3-8274-41b3-9583-5e0c393e7ee4	2026-01-02 12:34:57.083752	2026-01-02 12:34:57.083752
f636ef64-c340-4fed-9058-ff4d4e42395e	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Packers and drill bits	1	7776	78541fd4-7f48-42d4-8add-bd8f71c59cc0	2026-01-02 12:34:57.085578	2026-01-02 12:34:57.085578
f7b3eda1-ecfc-40a9-a6e1-b40316ccd7b6	37d5a717-f470-43b3-9bbc-4113e9d171e0	flyscreen frame	1	6000	91a7443b-d9d1-44d1-b47c-538699b04915	2026-01-02 12:34:57.115029	2026-01-02 12:34:57.115029
0bacc14a-66bd-4033-afdb-260ac0dabe34	9ba263d4-9d99-404b-9f47-109fc4fa4296	flyframe	1	5500	8eed3ced-4648-48f5-9542-14a3aa5df608	2026-01-02 12:34:57.094307	2026-01-02 12:34:57.094307
fc6a3a0e-0cfe-4cf9-8cc3-7961fdd67c9d	005c1242-89c9-4d64-b11d-5d983b4735a8	retractable flyscreen	1	51000	ab4b3b5d-016c-44d3-9579-0042d53fcf40	2026-01-02 12:34:57.127768	2026-01-02 12:34:57.127768
2b914f8c-6292-469c-9558-c9dfe0166ce7	b9b032f8-091d-41b3-8064-b2e6673a7609	bifold hardware	1	49500	a18d352d-0a5d-4c9a-a992-a43c06e52a0c	2026-01-02 12:34:57.122761	2026-01-02 12:34:57.122761
269f35a5-04a1-43ed-af91-765c3af6f5bc	37d5a717-f470-43b3-9bbc-4113e9d171e0	door frame	1	30800	ccf0ad62-a48e-4855-bf16-cfcb1bdf3202	2026-01-02 12:34:57.116007	2026-01-02 12:34:57.116007
5340c18f-e5ff-4b69-9f62-6d08baeee764	5926aae8-5ce2-4eec-a611-95aba3caaeab	Gap fillers	1	1785	8c8e74a9-cd17-47c9-a413-76aa53fd592b	2026-01-02 12:34:57.068748	2026-01-02 12:34:57.068748
ae90d78e-7276-4fe6-8ad3-f625dad3398c	37d5a717-f470-43b3-9bbc-4113e9d171e0	Flyframe	1	1848	96f8977e-4bb0-4d19-887c-957e98d1595d	2026-01-02 12:34:57.117045	2026-01-02 12:34:57.117045
dbb213a2-cb29-495d-b79c-65b71248015e	37d5a717-f470-43b3-9bbc-4113e9d171e0	Flyframe	1	2024	363e628d-b724-4eb4-8b62-375cbdfc0cc9	2026-01-02 12:34:57.117922	2026-01-02 12:34:57.117922
df99eb22-4ae3-422e-b44d-1bf2f9602f7b	37d5a717-f470-43b3-9bbc-4113e9d171e0	Flyframe	1	3036	cbc43117-5027-4044-a6ac-12333329d37b	2026-01-02 12:34:57.118526	2026-01-02 12:34:57.118526
10f8cb5f-1dbd-4117-ae2b-dba8b46e107c	9ba263d4-9d99-404b-9f47-109fc4fa4296	Screws	1	1705	f5345813-e168-4bf8-a175-bb62b24e5dfc	2026-01-02 12:34:57.096117	2026-01-02 12:34:57.096117
ded64125-bedc-4a4c-a3fc-20d1f304ae0f	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals	1	42008	419b6d1d-30f2-4fbb-bdad-0f5afd97f46a	2026-01-02 12:34:57.096828	2026-01-02 12:34:57.096828
d631934c-3166-46b3-adbc-e830ddd6a80d	2f469e47-c8ad-4a4d-a972-b089b6824fab	Spirals	1	35000	8483c92c-cb2d-4fe4-b70d-dfd998b8d1c4	2026-01-02 12:34:57.134604	2026-01-02 12:34:57.134604
fdc09a42-7af4-4d8e-8dd2-5dfb490d7915	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Pit driving trox	1	758	d51add44-93d1-401c-9bbc-eb74ab1da224	2026-01-02 12:34:57.142825	2026-01-02 12:34:57.142825
a56c910c-8410-4672-ab2f-caae1f6b04be	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Screw buggle button	1	2052	e0dc563c-49d0-4c24-ad4f-e2ac8aa2f8ea	2026-01-02 12:34:57.143583	2026-01-02 12:34:57.143583
c1712209-abe7-44a6-a040-8f13995a1b38	4b29664a-5bd7-4e29-b0dc-44a3abf4e926	Anchor screws	1	5872	06545bbb-27f1-4539-bac3-075b9d3c134f	2026-01-02 12:34:57.144228	2026-01-02 12:34:57.144228
4cb00a16-9d92-427d-8273-3aac88ab92bc	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	Brackets	1	6214	208d7867-81de-410f-9319-2822e522dfa7	2026-01-02 12:34:57.151482	2026-01-02 12:34:57.151482
fbc697ed-8ac9-49d4-8882-2a9ae8255085	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	Brackets	1	1912	464b4d18-a1fc-4e2a-9c99-1c346bcbdb2d	2026-01-02 12:34:57.15222	2026-01-02 12:34:57.15222
02072fed-ca0f-415a-bcf4-c89b0f046ee6	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	Brackets	1	5240	09d28ab0-3ac6-40fb-a50a-cc5c742205d8	2026-01-02 12:34:57.152756	2026-01-02 12:34:57.152756
8343e0f7-3bcc-4239-ab6b-8c46ebbf89b0	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals	1	37224	2b86102f-2a85-4844-938d-2fff5e29488c	2026-01-02 12:34:57.097377	2026-01-02 12:34:57.097377
6629e7e1-285a-4205-abfe-fcc0caefe588	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals	1	37296	39e5b052-321f-4efc-8bf5-68b6b1034935	2026-01-02 12:34:57.097899	2026-01-02 12:34:57.097899
97083eed-2694-4fed-b585-9ed3d8a9727d	9ba263d4-9d99-404b-9f47-109fc4fa4296	Door frames	1	29491	09e7e1cd-14ab-4866-90ee-878fb5141587	2026-01-02 12:34:57.098407	2026-01-02 12:34:57.098407
9734392e-863e-4e7f-b8f1-dd2a09178165	9ba263d4-9d99-404b-9f47-109fc4fa4296	Aluminum angles	1	3080	4942eeb1-7bfa-4e92-94c3-edf406798ca2	2026-01-02 12:34:57.098963	2026-01-02 12:34:57.098963
6e112b93-e981-4c87-b222-203b95bad694	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals	1	676	669e1b47-07a2-496d-8d93-5b02a9afb0c1	2026-01-02 12:34:57.09956	2026-01-02 12:34:57.09956
2e1f7e07-c66e-45a4-ac86-22c5f8be6497	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals	1	7056	d34052e2-0f5b-42a2-9db2-a3b499a70421	2026-01-02 12:34:57.101214	2026-01-02 12:34:57.101214
3ef24b63-7a55-4646-97be-c53ca260c9e7	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Aluminum doors and windows	1	1000000	7fb16386-ef1b-4c8b-aabc-543475dc7dad	2026-01-02 12:34:57.138226	2026-01-02 12:34:57.138226
0e46d911-b246-47c1-b9ad-5084b21934da	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Screws and plugs	1	11959	15552788-290d-44f8-acf1-235236bf3d4d	2026-01-02 12:34:57.138858	2026-01-02 12:34:57.138858
d855a575-b609-447a-a837-4c15fe6e205b	c54b137c-8ed7-425c-a408-80272ba1c953	Windows	1	20000	32e65340-e65f-473a-a752-f2fa256f72ab	2026-01-04 05:04:21.74478	2026-01-04 05:04:21.74478
2da2e78b-3207-4258-b3d4-534af57d1261	c54b137c-8ed7-425c-a408-80272ba1c953	Gap fillers	1	200	9bccc437-ab02-4ffd-a993-dd6d0fefad07	2026-01-02 12:34:56.775799	2026-01-02 12:34:56.775799
3c2a87f5-a734-4c10-9b41-336959118f2c	c54b137c-8ed7-425c-a408-80272ba1c953	Gap fillers	1	1585	\N	2026-01-04 05:09:46.70683	2026-01-04 05:09:46.70683
c42cb540-b968-4c74-9e3d-b6f2d613b6f8	b999eb78-03af-4adc-84d6-1e0142d8d57a	Bifold hardware	1	13875	86f3702f-150c-4dea-b4d3-661ce42d2e43	2026-01-04 05:19:54.745421	2026-01-04 05:19:54.745421
f9759c0f-c429-48b4-bf7d-bf448f8df687	b999eb78-03af-4adc-84d6-1e0142d8d57a	Bifold hardware	1	6000	e0bb16ea-e133-411c-908c-9e0f96cd9eb7	2026-01-04 05:24:45.088024	2026-01-04 05:24:45.088024
ec1d43af-528d-46cf-9f62-2db9e4ae54b6	b999eb78-03af-4adc-84d6-1e0142d8d57a	Bifold hardware	1	10000	e5f5dc4f-dae0-467f-aaf8-aaa2e201a6ef	2026-01-04 05:25:04.680035	2026-01-04 05:25:04.680035
852381d8-3b18-4992-8221-85d9e9add1b0	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	1550	6c3350e1-b8ab-4a9b-a056-a66891d8b02b	2026-01-04 05:33:09.718477	2026-01-04 05:33:09.718477
7868493a-65dd-4390-b534-7a1553bdba05	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	1000	9fd66205-41cc-41ce-b62e-a7030ef7fd26	2026-01-04 05:33:41.523984	2026-01-04 05:33:41.523984
315ed19e-cc88-4eac-9184-1337886a3125	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	911	05921566-79cc-4683-9e14-6ba7050e5145	2026-01-04 05:33:49.054035	2026-01-04 05:33:49.054035
859b5e73-c7a5-45b1-84be-b9c70da23392	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	3020	a52b52cd-1aa7-4a28-bd32-741a7669f812	2026-01-04 05:35:42.978277	2026-01-04 05:35:42.978277
f7d7621b-a785-4982-9e63-4f9906be18f1	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	2194	559f62ae-5a97-4ac8-a092-0131e0fbb833	2026-01-04 05:35:50.159841	2026-01-04 05:35:50.159841
1e93c6be-6479-476a-9553-83e31c2083bd	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	2166	2c98f25d-89c4-42e4-a094-0df2e8fb4e47	2026-01-04 05:35:59.545199	2026-01-04 05:35:59.545199
f672a1d4-e0eb-46ec-9bcb-d5f69939a7d4	0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	Windows	1	1160	cdcafb88-a427-4ff6-afbe-bbdbbc778f23	2026-01-04 05:36:49.481141	2026-01-04 05:36:49.481141
1fa6e47d-dc97-4b8c-933c-113ad495854c	ea74d278-b4c1-4f03-9ae9-426764acce85	Unknown	1	4267	7b64c3ff-2703-485f-9c7a-f09fe150aaa5	2026-01-04 10:09:20.093097	2026-01-04 10:09:20.093097
e8bcb658-8c1b-4ad5-907f-da4c2cde26ca	ea74d278-b4c1-4f03-9ae9-426764acce85	Unknown	1	1785	e08329df-0bc7-456c-901a-bbb1771d1a0a	2026-01-04 10:08:40.781986	2026-01-04 10:08:40.781986
c43c3e27-2443-48e3-9321-20c88f7f422b	ea74d278-b4c1-4f03-9ae9-426764acce85	Unknown	1	1785	41ad778a-6dac-4794-b4c5-9c87b706395b	2026-01-04 10:08:52.126257	2026-01-04 10:08:52.126257
ef439239-d26f-4db3-a58e-6b03414a300c	690b704e-00f1-4669-ba84-0313730faf10	Unknown	1	1026	66abc137-7cca-4142-810f-332b739bdba1	2026-01-04 10:41:39.760245	2026-01-04 10:41:39.760245
15fa8a4d-1fa0-4035-8165-b6114ffaff94	76a97d96-3b40-4c24-bfbe-e16362c59574	Unknown	1	331	6d3306ed-0819-47d1-869f-b4c9954abcaa	2026-01-04 18:41:35.300416	2026-01-04 18:41:35.300416
c590066c-9be4-4c34-b9ec-cc7f6a3a1ddd	76a97d96-3b40-4c24-bfbe-e16362c59574	Roller door	1	80000	64e722f8-7c86-4194-a988-4b1165b40337	2026-01-04 18:42:22.098793	2026-01-04 18:42:22.098793
c417cc52-7e42-48ea-915d-255ecfc98fd3	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals	1	6272	1ef2578b-d60f-4beb-8b2b-7c2bd926660c	2026-01-02 12:34:57.10027	2026-01-02 12:34:57.10027
b1c5f0e4-efae-4749-ad3a-fff33fc98ff7	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	Shaving cap rococo mondella	1	20330	6bc24bb3-abba-4c64-82f7-6981ecb903fe	2026-01-02 12:34:57.000839	2026-01-02 12:34:57.000839
3d39c36b-fb9c-49b0-a16c-3214d3859dcf	8ff6d22a-7c27-49d9-8e22-a22df96cc17b	Unknown	1	28316	05db684e-cd3d-40c7-93d7-e5d8167c8f56	2026-01-05 03:32:47.42591	2026-01-05 03:32:47.42591
db1e3613-5119-4544-92b4-ca480d3292f9	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals (refund)	1	-53784	0789c181-0279-47f5-9bfa-0661c8da2f2e	2026-01-05 03:57:35.165612	2026-01-05 03:57:35.165612
6d5cc9d8-7584-430e-b4a5-0d959ec7035e	9ba263d4-9d99-404b-9f47-109fc4fa4296	Spirals (refund)	1	-6272	4aef1d84-1e12-4211-9f05-d822ce1edc01	2026-01-05 03:57:56.14697	2026-01-05 03:57:56.14697
de77d0e7-afbb-44a7-86ae-aee04e164ca6	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Stables (refund)	1	-947	31ef2f8c-a4c4-4071-a05e-9f4fcfcc48d9	2026-01-05 04:01:20.728294	2026-01-05 04:01:20.728294
f83d38d4-e8f7-4087-95ed-c99ae982af2e	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Filler expanding foam	1	43200	05232422-6d5a-46f7-830b-a2857b15fd9a	2026-01-25 00:58:30.54735	2026-01-25 00:58:30.54735
f996c6ee-6095-40be-b829-8a91946ce7b3	e8c28b1b-e446-40b6-8a36-2d7934e193b4	Masking tape	1	1311	34704f72-cfdb-4011-b54f-339b38085a23	2026-01-25 00:59:11.64931	2026-01-25 00:59:11.64931
5e82b74e-3206-4a09-bbad-2796c255c6d2	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Subframe supplies	1	1500000	41719b2d-829a-47d5-80b7-47d1d6da321d	2026-01-25 01:01:51.590004	2026-01-25 01:01:51.590004
b06600f2-ecb5-4706-8634-a37636d63dad	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Brackets	1	5676	b45f2a67-1fb0-4ce0-8006-6f9b900e073d	2026-01-25 01:04:32.15914	2026-01-25 01:04:32.15914
afda5a50-9e25-499b-bf5b-6ae267b7e3dd	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Screws	1	4880	f21213eb-4bad-4f02-a292-463610547a36	2026-01-25 01:10:07.743475	2026-01-25 01:10:07.743475
c4c02c37-b542-4dbb-96d6-6e613fbb64cf	c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	Tie down	1	684	f0d0cebd-ab32-421d-b893-ee2032fad766	2026-01-25 01:12:47.85905	2026-01-25 01:12:47.85905
2c65bda5-f4fb-4f94-881b-a12e44c4f390	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Brackets	1	688	f176f908-8caf-4ef9-8b05-2b6b45c4aed2	2026-01-25 01:20:33.014383	2026-01-25 01:20:33.014383
b6426d49-791d-49c6-9acc-7bf6e2ecc1f2	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Supplies	1	533	18d9cb7b-e8d7-42d5-9b3b-40ad43bf4590	2026-01-25 01:31:56.400016	2026-01-25 01:31:56.400016
0b02eac8-9f21-4663-b1e0-7ccf91064bd5	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Mainframe	1	1500000	b792d6ee-db61-48a0-991c-cea027751187	2026-01-25 01:38:30.714189	2026-01-25 01:38:30.714189
c12b4478-e321-439a-8331-72d0f727501e	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Curving aluminium frame	1	107800	e1a29e9d-6135-431a-8202-84ed24526a15	2026-01-25 01:43:15.596759	2026-01-25 01:43:15.596759
400c012e-7040-49d0-a64a-38b0c34bd638	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Masking tape	1	1311	013f73bf-3641-42de-adc0-e3a29d5b851b	2026-01-25 01:51:37.010424	2026-01-25 01:51:37.010424
c33b8f42-59b1-4f67-99ea-f5daa8e83e67	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Sliding door panels	1	1300000	d82c9c64-106e-49a1-b866-5d8c8d31418e	2026-01-25 01:53:46.818596	2026-01-25 01:53:46.818596
1e7491d1-49ab-4f56-9c81-7b36380b3780	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Anchor screws and expanding foam	1	13236	fd6f32d2-461e-4b7b-9de8-f39e380f4444	2026-01-25 01:56:13.977933	2026-01-25 01:56:13.977933
16c1eca4-311a-4dcc-a016-8f3474e7e9d9	02a755e1-a5cb-4b07-9a24-d9528b1374d0	Angles	1	5192	d8594bb4-a22c-4d82-a92a-248338dc0b86	2026-01-25 01:56:44.520663	2026-01-25 01:56:44.520663
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, human_id, client, title, visit_date, start_date, end_date, address, meters, price, created_at, updated_at, margin, budget_units, budget_unit_value) FROM stdin;
9757617a-6853-459d-bd33-4feac0b3c5b9	P0001	Hinged door	Hinged door	2025-05-05	2025-05-05	2025-05-30	113 Barker St., Kingsford	\N	286000	2026-01-02 12:34:56.741121	2026-01-02 12:34:56.741121	0.2	1	131727
c54b137c-8ed7-425c-a408-80272ba1c953	P0002	Maria and Mark	Maria and Mark	2025-06-20	2025-07-01	2025-07-02	13/Johnson St., Mascot	\N	371800	2026-01-02 12:34:56.770213	2026-01-02 12:34:56.770213	0.2	1	131727
49cd8378-4481-4c2d-9e9e-268241211306	P0003	Double hung window	Double hung window	2025-05-26	2025-06-23	2025-07-02	259 Military Rd, Dover Heights	\N	143000	2026-01-02 12:34:56.784889	2026-01-02 12:34:56.784889	0.2	1	131727
b999eb78-03af-4adc-84d6-1e0142d8d57a	P0004	Sujad	Sujad	2025-06-10	2025-06-19	2025-07-02	24 Fullam Rd, Blacktown	\N	275000	2026-01-02 12:34:56.793274	2026-01-02 12:34:56.793274	0.2	1	131727
0cd718cd-eeb4-4f8d-b4b1-6cc7329918bd	P0005	Commercial grade owning windows	Commercial grade owning windows	2025-06-02	2025-07-04	2025-07-04	46 Robey St., Maroubora	\N	429792	2026-01-02 12:34:56.808695	2026-01-02 12:34:56.808695	0.2	1	131727
7b4689a1-e4cd-479a-bab9-802def112c4e	P0006	Kevin Berry	Kevin Berry	2025-05-28	2025-05-28	2025-05-28	29 Clarkes Rd, Ramsgate	\N	174500	2026-01-02 12:34:56.82163	2026-01-02 12:34:56.82163	0.2	1	131727
690b704e-00f1-4669-ba84-0313730faf10	P0008	Adam	Adam - Crown View	2025-07-18	2025-07-24	2025-07-24	13/29-31 Romsey St. Waitara	\N	635500	2026-01-02 12:34:56.845464	2026-01-02 12:34:56.845464	0.2	1	131727
6c6d6afd-4ab9-4111-b7eb-c67065c146ee	P0009	Niccole	Niccole - Security screens	2025-07-24	2025-07-25	2025-07-25	25 The Gully Road, Berowra	\N	132000	2026-01-02 12:34:56.862181	2026-01-02 12:34:56.862181	0.2	1	131727
70834d5a-77e2-46bb-aaad-6878642480db	P0010	Sundeep	Sundeep	2025-07-30	2025-08-07	2025-10-07	33 Bruhn Cct, Kellyville	\N	632500	2026-01-02 12:34:56.868091	2026-01-02 12:34:56.868091	0.2	1	131727
b4c26b44-88bc-4194-a735-7c45a3e9a497	P0011	James	James	2025-07-25	2025-08-08	2025-09-07	284-286 Pacific Highway Greenwitch	\N	610500	2026-01-02 12:34:56.886581	2026-01-02 12:34:56.886581	0.2	1	131727
76a97d96-3b40-4c24-bfbe-e16362c59574	P0012	Kawther	Kawther	2025-06-16	2025-08-07	2025-08-07	206 Leacocks Lane Casually	\N	308000	2026-01-02 12:34:56.895805	2026-01-02 12:34:56.895805	0.2	1	131727
42681f0f-6c97-4d1a-ab16-afc072737570	P0013	Gary D	Gary D	2025-08-19	2025-08-19	2025-08-19	51 Millar Rd	\N	104500	2026-01-02 12:34:56.900725	2026-01-02 12:34:56.900725	0.2	1	131727
22ffc1e1-7406-4a07-9b5d-f212a9fd220e	P0015	Chris	Chris	2025-09-03	2025-09-03	2025-09-03	30 Saint Johns Road, Glebe	\N	333300	2026-01-02 12:34:56.922551	2026-01-02 12:34:56.922551	0.2	1	131727
2c4ff727-51a4-4814-b167-ede3ea556e77	P0016	Guy	Guy	2025-09-03	2025-09-01	2025-10-08	277 Malabar Rd, Maroubra	\N	632450	2026-01-02 12:34:56.933488	2026-01-02 12:34:56.933488	0.2	1	131727
af77b699-a683-496f-9a9e-61a7dca30b3d	P0017	Fiona	Fiona	2025-09-03	2025-09-09	\N	1298 Bunnerong Rd, Phillip Bay 2036	\N	778470	2026-01-02 12:34:56.951083	2026-01-02 12:34:56.951083	0.2	1	131727
35e96736-2752-4b0d-a07e-c25dc5b3c572	P0018	Andrew	Andrew	2025-09-13	2025-09-15	2025-09-24	75 Shepherd Rd, Emu Plains	\N	230000	2026-01-02 12:34:56.958228	2026-01-02 12:34:56.958228	0.2	1	131727
8e08fbc4-0dd5-4b0e-992a-7ff584b3cd2b	P0019	Jessy	Jessy	2025-09-14	2025-09-15	2025-10-03	6 Douglas St., Redfern	5	485000	2026-01-02 12:34:56.964722	2026-01-02 12:34:56.964722	0.2	1	131727
bbd8274b-d1e3-48a4-806e-4b1d276e9a5f	P0020	Sabitri	Sabitri	2025-09-14	2025-09-15	2025-09-26	64 Wideview Rd, Berowra Heights	\N	325000	2026-01-02 12:34:56.970462	2026-01-02 12:34:56.970462	0.2	1	131727
1d8af109-85f2-4ab0-8f4c-b5717cf8e0f8	P0021	Steve	Steve	2025-09-15	2025-09-15	2025-09-15	N/A	\N	0	2026-01-02 12:34:56.980426	2026-01-02 12:34:56.980426	0.2	1	131727
d23c367d-7648-4f2e-bb88-775552ead5a9	P0022	Trent	Trent	2025-07-28	2025-09-16	2025-10-17	3/455 Pacific Highway, Lindfield	\N	245036	2026-01-02 12:34:56.9848	2026-01-02 12:34:56.9848	0.2	1	131727
a7edf71d-c062-4f95-9e3c-d8bc8c532983	P0023	Sujal	Sujal	2025-09-20	2025-09-24	2025-10-13	51A, Doyle Rd, Revesby	1	80000	2026-01-02 12:34:56.990476	2026-01-02 12:34:56.990476	0.2	1	131727
8ff6d22a-7c27-49d9-8e22-a22df96cc17b	P0024	Kitty	Kitty	2025-09-19	2025-10-07	2025-10-12	277 Malabar Rd, Maroubra	\N	290000	2026-01-02 12:34:56.99964	2026-01-02 12:34:56.99964	0.2	1	131727
d5fb1006-decb-4956-9088-ab2b73b962cf	P0025	Huy	Huy	2025-09-28	2025-10-01	2025-10-14	207 Victoria Rd, West Ryde	4.2	518690	2026-01-02 12:34:57.007649	2026-01-02 12:34:57.007649	0.2	1	131727
0110152b-bd06-466b-9247-36b3b0f779da	P0028	Andrew	Andrew	2025-10-07	2025-10-09	2025-10-27	24 Park Ave, Oatley	5.5	567260	2026-01-02 12:34:57.027476	2026-01-02 12:34:57.027476	0.2	1	131727
75813c8c-88d2-45e7-b996-ed9181abb268	P0030	Trent	Trent	2025-10-17	2025-10-17	2025-10-17	3/455 Pacific Highway, Lindfield	\N	55000	2026-01-02 12:34:57.043498	2026-01-02 12:34:57.043498	0.2	1	131727
5926aae8-5ce2-4eec-a611-95aba3caaeab	P0035	Safi	Safi	2025-10-31	2025-11-05	2025-11-19	360 New Canterbury Rd, Dulwich Hill	8.5	385000	2026-01-02 12:34:57.066442	2026-01-02 12:34:57.066442	0.2	1	131727
dcfd3c37-2606-44c1-b09d-c20b854b8a44	P0037	Max	Max	2025-11-03	2025-11-05	\N	93 Rose Eve, Wheeler Heights	5.5	435000	2026-01-02 12:34:57.077067	2026-01-02 12:34:57.077067	0.2	1	131727
e8c28b1b-e446-40b6-8a36-2d7934e193b4	P0038	Ahsen	Ahsen	2025-11-03	2025-11-10	\N	11 Varian St, Mount Drwitt	64	616000	2026-01-02 12:34:57.081692	2026-01-02 12:34:57.081692	0.2	1	131727
9ba263d4-9d99-404b-9f47-109fc4fa4296	P0039	Christine	Christine	\N	2025-11-29	2025-12-03	47 Glenayr Ave	\N	446000	2026-01-02 12:34:57.092664	2026-01-02 12:34:57.092664	0.2	1	131727
37d5a717-f470-43b3-9bbc-4113e9d171e0	P0040	Raphael	Raphael	2025-11-05	2025-11-20	2025-11-21	19 Kaperbush St, Melonba	\N	0	2026-01-02 12:34:57.113773	2026-01-02 12:34:57.113773	0.2	1	131727
b9b032f8-091d-41b3-8064-b2e6673a7609	P0041	Christopher	Christopher	2025-11-27	2025-11-27	2025-11-27	8 Athel St, South Coogee	\N	21000	2026-01-02 12:34:57.121721	2026-01-02 12:34:57.121721	0.2	1	131727
4b29664a-5bd7-4e29-b0dc-44a3abf4e926	P0045	Jeber	Jeber	2025-11-25	2025-11-25	\N	6 James St, Melrose Park	9	242000	2026-01-02 12:34:57.14148	2026-01-02 12:34:57.14148	0.2	1	131727
c17ab8b6-bc27-44e2-b5a2-af4bd0deb3a6	P0046	Ahsen	Ahsen	2025-11-26	2025-11-26	2025-11-29	11 Varian St, Mount Drwitt	63	253000	2026-01-02 12:34:57.15009	2026-01-02 12:34:57.15009	0.2	1	131727
b6320ca9-8b3a-4451-8118-1b6b0544f986	P0027	Cassy	Cassy	2025-10-10	2025-10-10	2025-10-10	Bedwell	\N	121000	2026-01-02 12:34:57.023141	2026-01-02 12:34:57.023141	0.2	1	131727
a6388f4f-02bf-49e0-9b74-d51628ac7b05	P0047	Phlippa	Replacing sliding windows	2025-11-23	\N	\N	202 Cooriengah Heights Rd, Engadine	6.2	352000	2026-01-25 01:28:32.752902	2026-01-25 01:28:32.752902	0.28	1	134221
02a755e1-a5cb-4b07-9a24-d9528b1374d0	P0044	Alan Despotov	Alan Despotov	2025-10-29	2025-12-06	\N	12 Sanders St., Caringbah South	216	8580000	2026-01-02 12:34:57.137076	2026-01-02 12:34:57.137076	0.2	9	131727
eb21b41a-8be0-4a8e-9880-e5987ca12a44	P0048	Matt	Replacement of sliding doors and sliding windows	2025-11-14	2026-01-24	\N	15 Sirius Pl, Engadine	23.85	2354000	2026-01-25 01:37:47.775207	2026-01-25 01:37:47.775207	0.2	2	134221
02d7fd59-e04d-4d30-8cc8-51b5dab2bc88	P0014	Rick	Rick	2025-08-18	2025-09-16	2025-09-16	11 Malvern Avenue Manly	\N	482240	2026-01-02 12:34:56.906377	2026-01-02 12:34:56.906377	0.2	1	131727
8e3d7051-cec0-42f3-b5f8-0130e93af56f	P0029	Huy	Huy	2025-10-15	2025-10-14	2025-10-17	207 Victoria Rd, West Ryde	\N	286000	2026-01-02 12:34:57.033588	2026-01-02 12:34:57.033588	0.2	1	131727
76a4a8c5-3e73-47b9-9416-030909165ed7	P0032	Sean	Sean	2025-10-09	2025-11-05	2025-11-12	126 Northern St, Croydon	4.8	453200	2026-01-02 12:34:57.053262	2026-01-02 12:34:57.053262	0.2	1	131727
39f350e5-58fd-402e-955b-612f29624236	P0026	Kim	Kim	2025-10-08	2025-10-09	2025-10-21	16 Narooma Ave	\N	85000	2026-01-02 12:34:57.018001	2026-01-02 12:34:57.018001	0.2	1	131727
f249b0de-1fa6-4027-baa2-89f04b0f24ca	P0034	Claudia	Claudia	2025-10-28	2025-11-13	2025-11-13	9 Folkestone Pde Botany	3	260000	2026-01-02 12:34:57.060349	2026-01-02 12:34:57.060349	0.2	0.75	131727
4e96cf11-e67e-42d4-8096-c604e7b041be	P0031	Paul McKenna	Paul McKenna	\N	2025-11-03	2025-11-06	323 Mccarrs Creek Road, Terry Hills	3.5	286000	2026-01-02 12:34:57.048275	2026-01-02 12:34:57.048275	0.2	1	131727
005c1242-89c9-4d64-b11d-5d983b4735a8	P0042	Paul McKenna	Paul McKenna	2025-11-06	2025-11-03	2025-12-03	323 Mccarrs Creek Road, Terry Hills	3.5	233750	2026-01-02 12:34:57.126666	2026-01-02 12:34:57.126666	0.2	1	131727
92b06e18-1882-4d30-8338-5ef8ed47ee8d	P0033	Aaron	Aaron	2025-10-21	2025-10-21	2025-10-21	26 Excelsior Ave, Castle Hill	\N	0	2026-01-02 12:34:57.05747	2026-01-02 12:34:57.05747	0.2	1	131727
2461e6fc-ac29-463d-acdf-2a9dcca8607f	P0036	Marisa	Marisa	2025-10-08	\N	\N	5 Nanette Place, Castle Hill	\N	130000	2026-01-02 12:34:57.072153	2026-01-02 12:34:57.072153	0.2	1	131727
2f469e47-c8ad-4a4d-a972-b089b6824fab	P0043	Kelly Goodall	Kelly Goodall	2025-11-21	2025-11-21	2025-11-21	72 74 Campbell Pde Bondi Beach	\N	60000	2026-01-02 12:34:57.133298	2026-01-02 12:34:57.133298	0.2	1	131727
ea74d278-b4c1-4f03-9ae9-426764acce85	P0007	Steven the builder	Steven the builder	2025-06-19	2025-07-05	2025-08-31	44 Cooper St, Strathfield	\N	290000	2026-01-02 12:34:56.828566	2026-01-02 12:34:56.828566	0.2	1	131727
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id) FROM stdin;
yAQHVl5LExXtP7GT9elmlM9EtXhHOLaU	2025-11-28 09:13:17.6	HJeK4tORHe955OKwv0IPCnXeH8ZuYAnb	2025-11-21 09:13:17.6	2025-11-21 09:13:17.6			3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
Ao2oCN31gwzEy3O4ylEVX1fwhWYbv0I4	2025-11-28 09:38:31.85	gtgk5pEIE4SpdGlKJBVbmtSpnA9O8bzr	2025-11-21 09:38:31.85	2025-11-21 09:38:31.85	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
emUbLYjnYkY8XBm2oVD6WMKaXQvp2M6d	2025-11-28 22:28:06.25	1T9HuksNdxyBT0fIqNDjy166leDB8vq9	2025-11-21 22:28:06.25	2025-11-21 22:28:06.25	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
Xu3ZBldokTbXciko2l7BM4ch2J5vLYwz	2025-11-30 01:15:55.811	S6Mu1rJYxTIu9WnEmLBMYr9L8d7p326N	2025-11-22 01:02:19.051	2025-11-23 01:15:55.811	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
CYH8LYzNmHMZuEZLDQWaGoiCwtMViCcN	2025-11-30 02:20:51.787	Kk8HDlOjQ50GHgFghUhFbd0RsO2BnUFI	2025-11-23 02:20:51.788	2025-11-23 02:20:51.788	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
g7yY5jsI6gRVRY7XZc8ZJ257gCqHvrd5	2025-11-30 08:02:11.297	5yCawjqmY3Fd3GTGPZwevwebEO7AJhVh	2025-11-23 08:02:11.297	2025-11-23 08:02:11.297	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
Ka5OOOKqUVBQGisOIMibs1sL8hoySGHI	2025-11-30 08:13:39.891	PV2XVue6jUKEMcv2P2AYYS9tJitkI3zR	2025-11-23 08:13:39.891	2025-11-23 08:13:39.891	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
Nb6e3ONGbeS5B7NrZnd4scgNSa2j3OGj	2025-11-30 08:17:39.724	E2FjJhLsMAF1r662EwuRgqxK3F6FXl2u	2025-11-23 08:17:39.725	2025-11-23 08:17:39.725	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
tFX1LfiG5H9PAagUiZJac2K1H6McG0X8	2025-11-30 08:21:11.478	85oqj484Rj3rKHFW14CoNPhHcANtNKtG	2025-11-23 08:21:11.478	2025-11-23 08:21:11.478	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
km3SE4N1U3X4qE11CKvfXrJGIJdSdKPx	2025-11-30 08:29:24.805	ORRXNmzDvVR0OyRrH9EW6JlP7boeVQLd	2025-11-23 08:29:24.805	2025-11-23 08:29:24.805	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
tNDUzZuNMPD3m7PRMLWu2PltXAbH2Xjq	2025-11-30 08:32:22.906	G0nknUMnUmlRPTVGKo6VvQaAcxaqBvkL	2025-11-23 08:32:22.906	2025-11-23 08:32:22.906	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
X5k550kW65q6gPwGajgS15oiJ0ucnxg6	2025-11-30 22:24:42.701	0y2vVy80PHLJMOYc9065GuGwPsC32KfU	2025-11-23 22:24:42.702	2025-11-23 22:24:42.702	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
i8UJGy5WOrnjzjwOdfRnN9EyakVb3s2d	2025-12-31 01:47:29.508	HgfXw3lUTZv5qz8XlkUSvHtHgh2wbkBw	2025-12-19 03:46:04.236	2025-12-24 01:47:29.508	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
GKUWh3utjtoejXEgmWvHkUSRJrprFNoW	2025-12-31 08:43:02.17	rKgtEsaqyU3rp2j4sJkIKhxR2Rxki04K	2025-12-24 08:43:02.17	2025-12-24 08:43:02.17	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
CCuXkSG7u3Bq5iXjyXboeI9fVprz7lsy	2026-01-06 17:17:13.696	OffK4fOGV78BEfHHspmfG3gSKDp0bdkF	2025-12-25 00:21:46.131	2025-12-30 17:17:13.696	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
tGFKhGAWgx053URze85JWXN1fG3rZWEP	2026-01-02 06:45:13.342	fPxujAhQAjxGFJF0Vr068b3YctlJIlHT	2025-12-26 06:45:13.343	2025-12-26 06:45:13.343	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
3I1ICXIUo35pNYkFeoHt17lWBb5VzNLX	2026-01-03 07:33:30.954	VmxJ2FZymEpyE8jQOmz4qMVtdp9SqAyN	2025-12-27 07:33:30.955	2025-12-27 07:33:30.955	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
DZef3CsIi0RdWdiTpa4HyVyUHR3KKU66	2026-01-30 09:51:35.624	u3WwYz9F4w8sIsweTewFWUVE2Kz1edTo	2025-12-30 19:03:34.79	2026-01-23 09:51:35.624	127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
17y3x6gyPbfiXvqhVfa1QrT0Ba9UtH18	2026-02-01 11:02:58.009	UPHRlpmh7fmKqiIpejnvFQlLmp7b2i7B	2026-01-24 10:37:36.403	2026-01-25 11:02:58.009	::1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, date, description, amount, type, account_id, created_at, updated_at) FROM stdin;
fc6b569c-d662-49b7-9366-da6d2de45928	2025-09-13	Bifold window	120000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.101564	2026-01-02 12:34:58.101564
c8a1748d-f3a5-4916-b35c-0e81d2429b70	2025-09-14	Remove, supply, and install doors and windows	210000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.130437	2026-01-02 12:34:58.130437
05aea2d6-4fa3-4121-92cf-b78beeacf4f6	2025-09-14	Retractable flyscreen	50000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.147831	2026-01-02 12:34:58.147831
ae91b417-f1fa-48a3-ba3f-9e1579ea4dba	2025-09-14	Labour	60000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.157449	2026-01-02 12:34:58.157449
c4e8a935-8e17-4196-b999-3716574cd2a5	2025-09-14	Salary	150000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.166533	2026-01-02 12:34:58.166533
72d8d7e1-6d8b-44cc-a048-3012d2ad650d	2025-09-18	Angles	9000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.172545	2026-01-02 12:34:58.172545
bad5cfe3-e06f-42f2-82d0-2ad0f0b3a28a	2025-09-19	A frame	90000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.179076	2026-01-02 12:34:58.179076
81c19fc1-8deb-4c9f-9304-2ba66037843c	2025-09-20	Casement window	50000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.182308	2026-01-02 12:34:58.182308
28f4369b-92db-432f-93ed-a83a987dd11d	2025-09-21	Labour	80000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.189797	2026-01-02 12:34:58.189797
13959d5c-cf55-4ff3-a976-50cc447170eb	2025-09-24	Bifold window	110000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.199646	2026-01-02 12:34:58.199646
c65cb7ab-f11e-493a-a404-7f09dc3f1b36	2025-09-24	Salary	150000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.205266	2026-01-02 12:34:58.205266
1d98aa49-70be-40a5-9b7d-c998b38f4e29	2025-09-26	Retractable flyscreen	275000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.210862	2026-01-02 12:34:58.210862
eaa24be2-5371-4ade-b5aa-1fe604615c61	2025-09-27	Jessy Redfern	250000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.218567	2026-01-02 12:34:58.218567
2570fc82-ab86-4b84-8f98-f315ad0cff68	2025-09-27	Labour	90000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.227327	2026-01-02 12:34:58.227327
d1d81ac2-ac35-4259-bb69-4b5dfa1f414a	2025-09-27	Salary	20000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.228533	2026-01-02 12:34:58.228533
c873e563-4700-49e7-8894-db0e00f94d71	2025-10-01	Cover sheets	100000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.229667	2026-01-02 12:34:58.229667
81e4a142-64b3-4df3-aaa7-c5c021b3878b	2025-10-03	Door jamb	25000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.237839	2026-01-02 12:34:58.237839
b2ff2767-eaca-4d13-b7af-253ab451dd76	2025-10-08	Project	100000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.246701	2026-01-02 12:34:58.246701
6ff7a060-8f60-4981-b56e-a96c3edc7556	2025-10-08	Ahmed labor	70000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.25322	2026-01-02 12:34:58.25322
8f08813f-66e3-43aa-a354-4631177e0854	2025-10-09	Project payment sujal	85000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.269547	2026-01-02 12:34:58.269547
53d748c6-3658-49a3-b6c6-1bb72218c475	2025-10-17	Ahmed labor	70000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.277161	2026-01-02 12:34:58.277161
2f24bde5-4d30-479b-964a-d11873c4bd9d	2025-10-18	Ahmed salary	160000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.296483	2026-01-02 12:34:58.296483
a61bf730-95b3-42bc-94da-ad5325488c58	2025-10-21	Kim project	70000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.299957	2026-01-02 12:34:58.299957
ed18ea26-7239-4fc4-90a0-3074150954f2	2025-10-21	Ahmed labor	60000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.305812	2026-01-02 12:34:58.305812
046e97c3-bda3-4922-9964-32efdc97a002	2025-10-23	Ahmed salary	80000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.322154	2026-01-02 12:34:58.322154
a941efcf-0e69-4ca5-b314-376b70901024	2025-10-31	Laptop	95000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.327232	2026-01-02 12:34:58.327232
e3a0181b-0ec8-4b3a-a868-62ec031d23c2	2025-11-10	Ahmed labor	50000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.330511	2026-01-02 12:34:58.330511
6b724aba-6480-41de-a625-23d9d587c678	2025-11-11	Packers	5350	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.343506	2026-01-02 12:34:58.343506
95b00a6c-7314-4fc8-813c-56d759528147	2025-11-13	Claudia Alkroft	135000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.359601	2026-01-02 12:34:58.359601
4bd1431e-5a4b-489d-b347-73ef58266a4a	2025-11-13	Ahmed labor	75000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.365591	2026-01-02 12:34:58.365591
512d6d54-14e3-4526-8160-1197e57f55fe	2025-11-25	Ziad labor	20000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.381515	2026-01-02 12:34:58.381515
20a4726e-a8ad-42da-b361-16964510a93b	2025-11-25	Ahmed labor	80000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.386849	2026-01-02 12:34:58.386849
35661ca4-926c-4aa1-9175-21409bbdd973	2025-11-27	Ahmed salary	95000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.398084	2026-01-02 12:34:58.398084
fa39fa6a-4e5c-4c7f-9faa-89f321d7686f	2025-11-27	Ziad labor	20000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.401518	2026-01-02 12:34:58.401518
5e83e29d-59a3-472c-9e40-26f6fa6c5069	2025-11-29	Christine project	50000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.404467	2026-01-02 12:34:58.404467
78dd5aa5-809f-49b3-8c97-e2e53242273c	2025-12-03	Christine project	300000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.409916	2026-01-02 12:34:58.409916
b40c631d-594c-4ae8-a726-9c3b995d2907	2025-12-04	Christine project	66000	income	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.418731	2026-01-02 12:34:58.418731
a2678623-93ab-48fa-931a-30e1b955dd13	2025-12-04	Ahmed labor	50000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.424746	2026-01-02 12:34:58.424746
b0d782ad-9430-4ea7-8071-548e5652056e	2025-07-01	withdrawal-osko payment 1662326 norman glazing	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.43995	2026-01-02 12:34:58.43995
a8d0f69d-0991-413a-b00e-145b8166c8be	2025-07-01	debit card purchase apple.com/bill sydney aus	299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.445133	2026-01-02 12:34:58.445133
c9eb7274-752a-4737-a2cb-ac8fbaf87739	2025-07-02	debit card purchase ezi*biz cover (No.3) sydney aus	6616	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.448499	2026-01-02 12:34:58.448499
b85bc4bf-8c8a-4431-bd19-c640e834f8c0	2025-07-02	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.453282	2026-01-02 12:34:58.453282
59f844bb-10ba-465c-bd30-9d5e1dc036b3	2025-07-02	debit card purchase bunnings 501000 rose bay aus	1116	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.455814	2026-01-02 12:34:58.455814
dcf79942-2009-41d5-af27-eb7f893d8c38	2025-07-03	debit card purchase woolworths 1323 blcktown aus	655	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.459107	2026-01-02 12:34:58.459107
e3bc2e94-a069-4d0c-8cff-c178703c6d04	2025-07-04	withdrawal at handygank auburn 2 23225166	30000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.467116	2026-01-02 12:34:58.467116
a05ded9f-b7f1-4f41-80f1-f3405fcedf56	2025-07-04	eftpos debit 0186335 shell reddy express papagewood	1550	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.471598	2026-01-02 12:34:58.471598
8ecf186c-6b98-4b28-8498-ae106cccaf6d	2025-07-04	eftpos debit 0186322 shell reddy express papagewood	1550	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.479892	2026-01-02 12:34:58.479892
b0769a83-1c9d-4bb8-b02b-30614cbf0e90	2025-07-04	eftpos debit 0186321 shell reddy express papagewood	1000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.488639	2026-01-02 12:34:58.488639
88cd42c0-d0c6-4d27-9a6e-5a42e78ccaee	2025-07-04	eftpos debit 0040431 q *nowness espresso bmaroubra	911	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.495884	2026-01-02 12:34:58.495884
6089e72e-875a-4485-b29c-316c564e8253	2025-07-04	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.502988	2026-01-02 12:34:58.502988
a6eb188b-fc44-4687-af64-a78bbdd12d83	2025-07-04	eftpos credit 0186322 shell reddy express papagewood n	1550	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.507663	2026-01-02 12:34:58.507663
81785d6a-5014-4652-a154-e49727b0d8a9	2025-07-07	withdrawal-osko payment 1767554 marlon jayona	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.516875	2026-01-02 12:34:58.516875
85bfd85e-4723-4eda-bf98-9dc62c7a07be	2025-07-07	debit card purchase costco wholesale pty lidcombe aus	41075	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.526131	2026-01-02 12:34:58.526131
cc3f9f0f-1106-4d9a-b4b9-623d66526bba	2025-07-07	debit card purchase ampol homebush homebush aus	13875	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.52898	2026-01-02 12:34:58.52898
85a33cd0-0a42-473b-b246-364c632913f0	2025-07-07	debit card purchase mahi capital pty ltd randwick aus	3020	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.53623	2026-01-02 12:34:58.53623
718a84af-0f67-4f76-b249-e717f5387f83	2025-07-07	debit card purchase bunnings group ltd hawthorn eas aus	2194	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.545043	2026-01-02 12:34:58.545043
3aab3743-c873-4099-bcac-432dd3663a11	2025-07-07	debit card purchase bunnings group ltd hawthorn eas aus	2166	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.552888	2026-01-02 12:34:58.552888
df7ea8b9-dd98-46ff-9156-3d390469b65e	2025-07-07	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.562477	2026-01-02 12:34:58.562477
9b53ef30-8d3d-4565-ba00-a8a1cd6d86ed	2025-07-07	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.565957	2026-01-02 12:34:58.565957
5a6bba21-a9a5-4c28-9964-61e38bed40d2	2025-07-07	debit card purchase point parking pty ltd randwick	1160	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.569299	2026-01-02 12:34:58.569299
3ee8fd12-cdc1-4c12-ac4c-f3dbbac333ca	2025-07-07	debit card purchase ampol rosebery 22364f rosebery aus	900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.577887	2026-01-02 12:34:58.577887
f84ace64-4663-470c-a676-c19d8db12e66	2025-07-07	deposit-osko payment 2111165 mr bradley marc berman 129 129	66500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.583852	2026-01-02 12:34:58.583852
237a34e4-f4a7-4777-9a28-7e75f8295f52	2025-07-08	withdrawal at handygank auburn 1 23224009	100000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.590348	2026-01-02 12:34:58.590348
dd825e13-f9d9-4e9f-9fbe-9dddf06760d6	2025-07-08	debit card purchase aluminium specialtie eastern cree aus	8033	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.598964	2026-01-02 12:34:58.598964
331f34e7-450d-47d2-b2c8-4a6bc1688187	2025-07-09	eftpos debit 0343610 bp mascot 2266 \\ mascot	200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.602551	2026-01-02 12:34:58.602551
7b7404fb-8f95-469f-ac38-a41d31535d74	2025-07-09	debit card purchase apple.com/bill sydney aus	1699	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.609471	2026-01-02 12:34:58.609471
da3c372b-63c0-4182-a451-ee02028383e2	2025-07-09	deposit-osko payment 29616744 aaa bayside homes pty ltd	50000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.613804	2026-01-02 12:34:58.613804
fad280d1-ad6e-4bbf-9869-26c37fb0cd8f	2025-07-10	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.621271	2026-01-02 12:34:58.621271
3bd8173c-f170-4fb6-983d-9ba81bbe6509	2025-07-10	deposit 2967078 mark mc lean 13 johnson st mascot 13 johnson st mascot	92950	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.624652	2026-01-02 12:34:58.624652
f28b8a0d-7c9f-4f83-bd2a-76db1f088d11	2025-07-11	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.633868	2026-01-02 12:34:58.633868
fde97357-114b-4072-a87a-45bd25e5cb88	2025-07-11	debit card purchase apple.com/bill sydney aus	449	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.637322	2026-01-02 12:34:58.637322
66f9951c-dcff-4918-9057-1f53983337a1	2025-07-14	Debit card refund bunnings group ltd hawthorn eas aus	3231	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.640141	2026-01-02 12:34:58.640141
b596d792-8b97-441e-9bcf-8385dc60912d	2025-07-14	debit card purchase ampol croydon 22430f croydon aus	350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.643468	2026-01-02 12:34:58.643468
70ec7839-4482-44fa-947a-439ec68f3f86	2025-07-14	debit card purchase apple.com/bill sydney aus	1599	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.650559	2026-01-02 12:34:58.650559
d9bc0d80-3a30-4c2c-b961-30bf7627b093	2025-07-14	debit card purchase bunnings group ltd hawthorn eas aus	1785	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.654409	2026-01-02 12:34:58.654409
2cbea24c-5f78-45af-a9ab-810d6da22fb2	2025-07-14	debit card purchase bunnings group ltd hawthorn eas aus	1785	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.66131	2026-01-02 12:34:58.66131
37184d11-ae5f-4207-900f-e300207018a3	2025-07-14	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.669668	2026-01-02 12:34:58.669668
fdb11936-2c36-492b-9bd9-00ffcee1f106	2025-07-14	debit card purchase bunnings group ltd hawthorn eas aus	3231	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.67271	2026-01-02 12:34:58.67271
a5177fa9-937d-46fe-848f-3ee4082954e8	2025-07-14	debit card purchase costco auburn lidcombe	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.676108	2026-01-02 12:34:58.676108
6d7162b3-115c-4b6d-abc6-290f00c074a1	2025-07-14	withdrawal-osko payment 145158 mr top group pty ltd	6000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.684994	2026-01-02 12:34:58.684994
635d4bc3-bef9-4d72-aade-921728f77463	2025-07-14	withdrawal-osko payment 1739756 abdulhabeeb	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.691882	2026-01-02 12:34:58.691882
9c0e6ca0-b024-4a94-8c09-8164ad4b6cd0	2025-07-15	debit card purchase apple.com/bill sydney aus	300	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.696909	2026-01-02 12:34:58.696909
6da4ef65-dea2-4869-90e7-468dd5a3c472	2025-07-15	tax refund	778580	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.701875	2026-01-02 12:34:58.701875
d5f7cf76-6759-4ef8-bdb1-194228f09b4a	2025-07-16	certificate 3 glass and glazing rbl	308000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.70543	2026-01-02 12:34:58.70543
801c0b25-30fd-41fe-a109-ab49bf50a22d	2025-07-16	deposit 296252 mark mc lean 13 johnson st mascot 13 johnson st mascot	82950	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.709567	2026-01-02 12:34:58.709567
f3757483-2d53-41a0-a721-19b0ce76ca6e	2025-07-16	debit card refund bunnings 593000 lidcombe aus	17800	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.722348	2026-01-02 12:34:58.722348
540e6940-4d4d-4e3f-975d-787efb758b6e	2025-07-16	debit card refund bunnings 593000 lidcombe aus	38800	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.725744	2026-01-02 12:34:58.725744
0187cec6-a334-47ea-8228-41ea00fba962	2025-07-16	debit card purchase bunnings 593000 lidcombe aus	166250	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.729156	2026-01-02 12:34:58.729156
f0388654-08f2-4ea4-b68c-d2396b2c4066	2025-07-16	withdrawal-osko payment 1019345 marlon jayona	6000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.733441	2026-01-02 12:34:58.733441
a7fc4c11-8ddb-4a33-b9c3-44cf7462af57	2025-07-17	deposit-osko payment 2045359 aaa bayside homes pty ltd	50000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.738692	2026-01-02 12:34:58.738692
c64ac9d4-f64f-4936-b2a6-6da81c6e7972	2025-07-17	debit card refund bunnings group ltd hawthorn eas aus	4900	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.746526	2026-01-02 12:34:58.746526
f3acaac1-15ad-426f-8083-8aa42ab64134	2025-07-17	debit card refund bunnings group ltd hawthorn eas aus	8900	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.750968	2026-01-02 12:34:58.750968
fa4f7109-1a67-4856-bd23-fa842cfb2b5c	2025-07-17	debit card refund bunnings group ltd hawthorn eas aus	9900	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.754076	2026-01-02 12:34:58.754076
01649f5c-0ac7-4178-9cf7-7d417a2f09ab	2025-07-17	debit card refund bunnings group ltd hawthorn eas aus	36900	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.757017	2026-01-02 12:34:58.757017
89ed7557-1760-4e14-a3d1-c57c7ba7f854	2025-07-17	debit card purchase budget direct toowong aus	21339	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.760189	2026-01-02 12:34:58.760189
6be70dd4-eeb3-48d6-baf3-600a4d9d31fe	2025-07-17	debit card purchase home improvement pages sydney aus	43900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.763079	2026-01-02 12:34:58.763079
49ac9f22-4089-4a84-ab9a-13fa8b035820	2025-07-17	eftpos debit 0352461 el jannah burwood burwood	390	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.766355	2026-01-02 12:34:58.766355
35498e07-d0b6-4ba2-a55d-60e3ea2cc0f2	2025-07-17	eftpos debit 0361634 el jannah burwood burwood	1800	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.7741	2026-01-02 12:34:58.7741
2c89162a-a33a-4370-8958-ccdaa387d3cf	2025-07-17	eftpos debit 0367735 el jannah burwood burwood	900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.780278	2026-01-02 12:34:58.780278
30746f00-30a9-4ec8-b2f8-e77a825a41ed	2025-07-17	eftpos debit 0456517 el jannah burwood burwood	900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.788823	2026-01-02 12:34:58.788823
d0c98061-78b7-4ea4-825e-07f4efaafb66	2025-07-17	eftpos debit 0747113 ls the brew spot sydney	1360	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.796182	2026-01-02 12:34:58.796182
619d345d-d159-4be0-8380-1b3f0548baa1	2025-07-18	deposit-osko payment 2464506 crownview projects pty ltd t/as cro 133 deposit waitar	280500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.802491	2026-01-02 12:34:58.802491
d892438f-e965-4912-a68d-e4fa942af7f7	2025-07-18	debit card purchase 7-eleven 2219 epping aus	350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.811251	2026-01-02 12:34:58.811251
f87560b4-5837-44d4-af9c-0381c3b0fb54	2025-07-18	debit card purchase bunnings group ltd hawthorn eas aus	23827	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.818636	2026-01-02 12:34:58.818636
b7a7781b-d330-4035-b2a7-09aa7765940e	2025-07-18	withdrawal-osko payment 1978308 ziad abdulhabeeb	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.821764	2026-01-02 12:34:58.821764
040e5523-12d4-4d5e-9f90-ed73d83ad9ff	2025-07-21	debit card purchase costco auburn lidcombe	43	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.828971	2026-01-02 12:34:58.828971
0a0d5a82-138b-4721-bd15-f57605234353	2025-07-21	debit card purchase woolworths 1624 strathfield aus	587	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.834117	2026-01-02 12:34:58.834117
8adda189-2255-47a5-a47f-53468c8acf6a	2025-07-21	debit card purchase bunnings group ltd hawthorn eas aus	1235	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.839377	2026-01-02 12:34:58.839377
e21a9d10-65f6-4bd2-a046-4e76e2835a73	2025-07-21	debit card purchase costco auburn lidcombe	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.844366	2026-01-02 12:34:58.844366
1cdbdbb3-7a51-4dde-9168-c4952d31bd89	2025-07-21	debit card purchase costco wholesale pty lidcombe aus	21998	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.849692	2026-01-02 12:34:58.849692
f319a563-615b-4c4b-9ba5-c432b38cbe80	2025-07-21	withdrawal-osko payment 1848631 y zhang	55000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.853467	2026-01-02 12:34:58.853467
a6bb660d-d0ca-4609-b821-2c0ccbe5af0e	2025-07-22	deposit-osko payment 2572697 kevin berry kevin berry	34550	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.856767	2026-01-02 12:34:58.856767
d82d11df-5ce2-48da-97d2-bb0d6ed699d7	2025-07-22	withdrawal mobile 6424401 bpay alspec	18267	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.863598	2026-01-02 12:34:58.863598
a07fdbfb-cda7-471d-847b-d78d4d6ff702	2025-07-22	eftpos debit 0896774 el jannah burwood burwood 22/07	4200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.871204	2026-01-02 12:34:58.871204
d130fb18-2b6f-43d2-83df-125c6efb70d2	2025-07-23	debit card purchase bunnings group ltd hawthorn eas aus	4267	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.8781	2026-01-02 12:34:58.8781
1a5e42e7-b9a2-4fdf-b2b1-a1793d9e4ad0	2025-07-24	debposit-osko payment 2386704 aaa bayside homes pty ltd	120000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.885284	2026-01-02 12:34:58.885284
b9b4ec1d-9324-4de7-8f92-dca48fdc3e76	2025-07-24	debit card purchase speedway south granv south granvi aus	400	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.891248	2026-01-02 12:34:58.891248
6068cdca-c4e8-46a0-824d-c7de575fddb2	2025-07-24	withdrawal-osko payment 1104599 ahmed hasan ahmedalhamded	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.897751	2026-01-02 12:34:58.897751
bd76e666-183d-4d6d-bd1e-a64c1f33dcd7	2025-07-24	withdrawal-osko payment 1535004 mr top group pty ltd nv-2008	275000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.902752	2026-01-02 12:34:58.902752
3b1db758-a8d5-4501-876e-9e87f80ff328	2025-07-24	eftpos debit 0161554 apple\\apple.com/bill \\mv2nl8h6l2a0 23/07	2999	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.90771	2026-01-02 12:34:58.90771
8bc5a564-7ade-4cf1-98a6-c61f94f676eb	2025-07-25	deposit 2230472 n baillie baillie inv 134 deposit	66000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.91118	2026-01-02 12:34:58.91118
84a96b2b-caa9-4394-bc5b-ef1a47874070	2025-07-25	debit card purchase eg group 1853 dural aus	350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.924453	2026-01-02 12:34:58.924453
7c5ab889-5183-4b47-996f-2afbbf703043	2025-07-26	personal charge	70580	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.931866	2026-01-02 12:34:58.931866
1c57dee6-ab05-4da6-869e-1a301058bc64	2025-07-28	deposit-osko payment 2349187 n baillie baillie inv 134 final payment	66000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.934576	2026-01-02 12:34:58.934576
8deff536-7972-40a4-8fa4-178f2b003582	2025-07-28	debit card purchase ampol pendle hi 22707f pendle hill aus	350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.940823	2026-01-02 12:34:58.940823
3ebb3eb0-73cd-4aec-b784-e14cb22cfb89	2025-07-28	debit card purchase costco auburn lidcombe	10754	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.949245	2026-01-02 12:34:58.949245
dc1b96b4-b6b6-4c26-9023-f609b92d3fd5	2025-07-28	debit card purchase yt aluminium australia milperra aus	12234	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.954872	2026-01-02 12:34:58.954872
3b78b770-d7cc-4099-8a57-ea2ee89ae91b	2025-07-28	debit card purchase bunnings group ltd hawthorn eas aus	68210	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.959867	2026-01-02 12:34:58.959867
82ba32aa-7f04-4294-94f6-a8464bfc35b2	2025-07-28	eftpos debit 0394670 keeler hardware north willoug	4545	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.964576	2026-01-02 12:34:58.964576
e5637160-72ad-4541-9466-bbf07dbe04fc	2025-07-30	debit card purchase wilson parking syd179 blacktown aus	406	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.969085	2026-01-02 12:34:58.969085
73eea676-6465-4b4c-add7-102524718e7e	2025-07-30	debit card purchase ezi*biz cover (No.3) sydney aus	6616	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.974194	2026-01-02 12:34:58.974194
edf4e29c-7d7b-4dfb-880d-f58fc1adb0c4	2025-07-30	withdrawal-osko payment 1787808	7000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.977525	2026-01-02 12:34:58.977525
07e1f6cd-95ad-4ddc-a9b6-d379a7a16be6	2025-07-31	debit card purchase oprto blacktown blacktown aus	2120	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.982155	2026-01-02 12:34:58.982155
f2098880-765c-4246-8d7c-226b40d8da7c	2025-07-31	debit card purchase el jannah kogarah kogarah aus	4200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.987947	2026-01-02 12:34:58.987947
e2db7f95-105f-4de9-a27c-60ffbf9bc814	2025-08-01	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.993989	2026-01-02 12:34:58.993989
16d66604-482c-44dd-87b5-4d71284bb579	2025-08-01	debit card purchase home improvement pages sydney aus	76890	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:58.998342	2026-01-02 12:34:58.998342
bc4e375a-4546-4505-919d-33b9fa06fb84	2025-08-04	deposit-osko payment 2256319 crownview projects pty ltd t/as cro 133 final balance	187000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.00108	2026-01-02 12:34:59.00108
593f84a1-b09d-4dc3-9366-cb05e5482039	2025-08-04	debit card refund bunnings group ltd hawthorn eas aus 	3998	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.007024	2026-01-02 12:34:59.007024
80f1227d-b684-4c0d-8a58-52f975c9f615	2025-08-04	debit card purchase bunnings group ltd hawthorn eas aus 	379	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.010674	2026-01-02 12:34:59.010674
71072c88-0f7f-42d6-bb7b-ee81dfd98a26	2025-08-04	debit card purchase otr pennant hills east pennant hill aus	898	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.014871	2026-01-02 12:34:59.014871
bb91c135-1720-4232-a3b4-dae673637c05	2025-08-04	debit card purchase otr pennant hills east pennant hill aus	1700	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.021467	2026-01-02 12:34:59.021467
ddb75ebd-bc46-46db-92f9-d6df67c32cce	2025-08-04	debit card purchase 7-eleven 2025 north rocks aus	1858	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.024587	2026-01-02 12:34:59.024587
4478a78d-05bb-4aac-a2e3-2a93a252452b	2025-08-04	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.031688	2026-01-02 12:34:59.031688
5fc318c6-9e72-46d0-b01f-4a23d762d044	2025-08-04	debit card purchase oporto hornsby aus	3150	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.035342	2026-01-02 12:34:59.035342
01828507-c889-497e-8907-55335f95889c	2025-08-04	debit card purchase bunnings group ltd hawthorn eas aus 	4086	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.040741	2026-01-02 12:34:59.040741
42ddba68-c1d2-4116-be43-cfafc9241c91	2025-08-04	debit card purchase costco auburn lidcombe aus	10584	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.046831	2026-01-02 12:34:59.046831
be610d38-51fd-45a7-869e-9b0482c3506a	2025-08-04	debit card purchase bunnings group ltd hawthorn eas aus 	21403	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.053099	2026-01-02 12:34:59.053099
8ee62a45-fe5f-4c72-99da-9f12bd80525d	2025-08-04	debit card purchase bunnings 573000 thornleigh aus	52155	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.057644	2026-01-02 12:34:59.057644
dba6ff05-c95d-4b5e-95e4-9b1a8d566b52	2025-08-04	withdrawal-osko payment 1624196 ahmed hasan ahmedAlhamded	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.060816	2026-01-02 12:34:59.060816
a000c066-8229-42df-930b-036a51e26111	2025-08-05	deposit-osko payment 2009721 fsf project pty ltd t/as urban fixx balcony sliding door 50 payment nbr 147	305250	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.066948	2026-01-02 12:34:59.066948
1ceccdf5-4552-4d6d-86fc-aec1a0e3e057	2025-08-05	deposit-osko payment 2371985 neeti gupta bi fold money	632500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.075407	2026-01-02 12:34:59.075407
f2d8bf79-20c2-410b-8f4d-ae0c345b6585	2025-08-05	debit card purchase bunnings group ltd hawthorn eas aus 	15473	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.082991	2026-01-02 12:34:59.082991
09455933-eb9f-4443-a58f-b711fda3b846	2025-08-05	withdrawal-osko payment 1037748 mr top group pty ltd	300000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.086367	2026-01-02 12:34:59.086367
7d023efd-0d68-41c0-9ca8-48ed58450e22	2025-08-07	deposit-osko payment 2352629 ms jane anne berry 29 clarkes road	77275	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.090819	2026-01-02 12:34:59.090819
6b0f2abc-dc9b-4c9f-b2db-998f06ac46d4	2025-08-07	deposit-osko payment 2632730 kawthar haa raheemy garage door 141 & 140	192500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.09957	2026-01-02 12:34:59.09957
c12bf1fe-e171-43d8-83c5-dd1dadbf2bd6	2025-08-07	debit card purchase bunnings group ltd hawthorn eas aus 	331	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.106216	2026-01-02 12:34:59.106216
1f1f4d3b-a32f-4a21-b06f-fa3ebb4e5c54	2025-08-07	withdrawal-osko payment 1548740 ace garage door	80000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.116914	2026-01-02 12:34:59.116914
ec64db78-8138-4892-8b70-105212dbcae3	2025-08-07	eftpos debit 0255819 syd tools smithfield smithfield 07/08	44490	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.124115	2026-01-02 12:34:59.124115
60c85108-e778-45f4-97bf-8dcdc3bbdd05	2025-08-07	eftpos debit 0305941 el jannah smithfield 07/08	2150	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.126776	2026-01-02 12:34:59.126776
329424dd-1154-4ab5-9fec-031d9701fcdb	2025-08-08	debit card purchase apple.com/bill sydney aus	1699	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.133384	2026-01-02 12:34:59.133384
6301ae88-883c-4fbe-830c-c7f14f9cfa12	2025-08-08	debit card purchase bunnings group ltd hawthorn eas aus 	2138	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.136474	2026-01-02 12:34:59.136474
23ba03d9-eddc-4fe0-a2be-c3d37b2359ee	2025-08-08	debit card purchase bunnings group ltd hawthorn eas aus 	12900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.140551	2026-01-02 12:34:59.140551
2cee1ce8-9d18-474a-ad5a-f2f3b0447551	2025-08-08	withdrawal-osko payment 1360844 mr top pty ltd	517000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.147943	2026-01-02 12:34:59.147943
ab58e384-f920-4ee2-9e24-6197ba9cebbc	2025-08-08	withdrawal-osko payment 1452518 jonathan wu	250000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.152651	2026-01-02 12:34:59.152651
7c4889f8-a3cf-4590-b348-c17b3c94e3c2	2025-08-08	eftpos debit 0501461 nandos_au_pinpads north ryde	4585	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.158569	2026-01-02 12:34:59.158569
a92f625b-6a63-4209-b950-137cabe98c5e	2025-08-11	debit card purchase bunnings group ltd hawthorn eas aus 	1026	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.165315	2026-01-02 12:34:59.165315
1af99d3f-c0b9-4687-9a24-898c954e2f6c	2025-08-11	debit card purchase costco auburn lidcombe aus	8000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.17419	2026-01-02 12:34:59.17419
b9b9c9b2-61cd-4189-a228-783a93b28ac4	2025-08-11	debit card purchase bunnings group ltd hawthorn eas aus 	15163	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.181403	2026-01-02 12:34:59.181403
5112d5fc-1474-4b12-bb84-eea7623c9ced	2025-08-11	withdrawal at handybank auburn 2 23225148	5000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.185339	2026-01-02 12:34:59.185339
9bc16a7d-0d37-4c90-90e5-55d0349afc02	2025-08-13	debit card purchase apple.com/bill sydney aus	1599	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.189013	2026-01-02 12:34:59.189013
170380ac-931b-4d89-bf29-e8fd60311f2f	2025-08-15	debit card purchase bunnings group ltd hawthorn eas aus 	8356	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.192222	2026-01-02 12:34:59.192222
7a41474c-2dfa-420a-a6d7-b8938474f698	2025-08-18	debit card purchase bunnings group ltd hawthorn eas aus 	4500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.195073	2026-01-02 12:34:59.195073
6df0c240-9f44-40fb-9ec8-2e2b42113417	2025-08-18	debit card purchase bunnings group ltd hawthorn eas aus 	7970	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.197936	2026-01-02 12:34:59.197936
305b9d0d-8c63-4606-a3e6-31dfa8af8ce1	2025-08-19	deposit 000143	52250	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.202138	2026-01-02 12:34:59.202138
c1ce58be-dac1-4ae4-bf99-c7485e2a71de	2025-08-19	debit card purchase costco auburn lidcombe aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.208318	2026-01-02 12:34:59.208318
4d4884a8-ccf5-46be-8802-389564d9a4e4	2025-08-19	debit card purchase budget direct toowong aus	21339	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.213501	2026-01-02 12:34:59.213501
6d7af35d-ebad-4d37-8978-13dfa7b26ca3	2025-08-20	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.218023	2026-01-02 12:34:59.218023
d3b96a51-8b4d-4421-9fcb-fc75827bf892	2025-08-20	withdrawal-osko paymnet 1090990 norman glazing	2750	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.221106	2026-01-02 12:34:59.221106
1e527791-c4b0-4908-8a07-2e128f9c7812	2025-08-21	deposit-osko payment 2324549 mr riccardo winston casali deposit manly windows casali manly	215000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.22556	2026-01-02 12:34:59.22556
b5dd066b-561f-440c-af00-d2a266ce4b4c	2025-08-21	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.230793	2026-01-02 12:34:59.230793
ba72aa39-1dce-451d-beb3-45e3497c29af	2025-08-25	debit card purchase apple.com/bill sydney aus	300	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.235928	2026-01-02 12:34:59.235928
7b5f50a7-8e3c-40ac-a52e-c2f39401cfe0	2025-08-25	eftpos debit 0080991 speedway woodpark woodpark	12297	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.238557	2026-01-02 12:34:59.238557
77b94ed8-d68f-455b-a7bc-e7b458c5afa0	2025-08-26	debit card purchase bunnings group ltd hawthorn eas aus 	9043	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.251726	2026-01-02 12:34:59.251726
7f9248dc-c7bf-4316-b59b-dd5cb4cdee81	2025-08-26	eftpos debit 0430151 bp express 2250 \\ kellyville 25/08	1270	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.256374	2026-01-02 12:34:59.256374
81180527-8caf-41b7-89c1-d88a49530e51	2025-08-26	eftpos debit 0430158 bp express 2250 \\ kellyville 25/08	2390	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.262517	2026-01-02 12:34:59.262517
e43c2a22-0be8-4865-8f65-5f5ca639b58c	2025-08-27	debit card purchase 7-eleven 2319 northmead aus	300	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.269837	2026-01-02 12:34:59.269837
7903efd3-58b9-4ea3-8114-810242c01c88	2025-08-27	debit card purchase otr rouse hill rouse hill aus	1194	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.27257	2026-01-02 12:34:59.27257
db1cb0a6-e644-4006-9576-3aa704628e9c	2025-08-27	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.277925	2026-01-02 12:34:59.277925
a0bcc480-61d3-4688-b063-68aeb72df5b1	2025-08-27	debit card purchase linkt sydney sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.28073	2026-01-02 12:34:59.28073
e340ad87-d127-4c56-b0ac-2b9c6ffeaf9d	2025-08-27	debit card purchase post guildford west lp guildford we aus	7700	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.283509	2026-01-02 12:34:59.283509
f7e295f2-7e12-4e89-a901-1c8b862ebb4d	2025-08-27	debit card purchase bunnings group ltd hawthorn eas aus 	14086	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.287207	2026-01-02 12:34:59.287207
2f16a698-0249-4a97-8999-2f1a9e9d6088	2025-08-27	debit card purchase kennards hire ho nsw 2 seven hills aus	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.291093	2026-01-02 12:34:59.291093
d9beddfe-731d-4738-9c83-76435ad992d8	2025-08-27	debit card purchase complete lintels pty annagrove aus	24320	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.296176	2026-01-02 12:34:59.296176
f26a98bd-6a7e-4650-a426-ae3c7cd79dd7	2025-08-28	debit card purchase bunnings group ltd hawthorn eas aus 	2945	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.300998	2026-01-02 12:34:59.300998
a7c62f6b-4bde-412e-8e87-8b1fe0978715	2025-08-28	debit card purchase bunnings group ltd hawthorn eas aus 	12638	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.307541	2026-01-02 12:34:59.307541
bef76746-7d2b-400d-bdf7-97ecef0609b3	2025-08-28	debit card purchase bunnings group ltd hawthorn eas aus 	12969	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.310508	2026-01-02 12:34:59.310508
eb480dff-52ba-4356-80f5-13300aa4e08a	2025-08-29	withdrawal-osko payment 1117838 hua long international p/l t/a ozne	35000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.320031	2026-01-02 12:34:59.320031
45060778-db01-4104-8698-45485c47f4af	2025-09-01	deposit-osko payment 2277106 ms qihua lin cancel order. refund cancel order.	150000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.324301	2026-01-02 12:34:59.324301
f064c5c6-d514-4611-a388-4804b97fb893	2025-09-01	trasaction fee	300	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.330913	2026-01-02 12:34:59.330913
9b73ea8e-04ff-41a9-afe5-0c91ba149c66	2025-09-01	debit card purchase ezi*biz cover (no.3) sydney aus	6616	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.333819	2026-01-02 12:34:59.333819
84519c12-7732-4026-b794-300f1f1ae6e9	2025-09-01	debit card purchase home improvement pages sydney	47190	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.337214	2026-01-02 12:34:59.337214
ed036bd3-505c-4679-b07f-2d39f25a5743	2025-09-01	withdrawal-osko payment 1080741 normn glazing rick gary	150000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.339966	2026-01-02 12:34:59.339966
f946be77-506c-459f-add8-f6d926629b47	2025-09-01	withdrawal-osko paymen 1210338 walco aluminium pty ltd	120000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.344132	2026-01-02 12:34:59.344132
b994572e-bbdd-4bf8-9ed6-303b93605788	2025-09-02	deposit crownview projec 133 additional	80000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.349087	2026-01-02 12:34:59.349087
0dab36c2-1919-4e9b-86e0-56ffef34d05c	2025-09-02	debit card purchase post merrylands post s merrylands aus	2299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.355752	2026-01-02 12:34:59.355752
bb28eeec-eaf6-4e2e-9724-00cff8e8f6d3	2025-09-02	debit card purchase costco auburn lidcombe aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.361094	2026-01-02 12:34:59.361094
6861d6bf-1f39-4dfa-aa04-89f1bd3da006	2025-09-02	debit card purchase snsw merrylands merrylands aus	77200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.367111	2026-01-02 12:34:59.367111
5124579c-1ad2-471b-8c9f-8f737e61cc38	2025-09-02	withdrawal-osko payment 1856544 ahmed hasan ahmedalhamded	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.370062	2026-01-02 12:34:59.370062
3615818a-eb75-4fd5-8b09-3720265bea4f	2025-09-03	deposit-osko payment 2863883 fsf project pty ltd / as urban fixx nbr 137 second	150000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.378121	2026-01-02 12:34:59.378121
f1f9c0ff-10c3-4486-b66b-1ee1238f28e2	2025-09-03	debit card purchase otr pennant hills east pennant hill aus	695	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.385039	2026-01-02 12:34:59.385039
1d6d5c9c-ab81-44f7-8051-0b4ab5e2eb28	2025-09-03	eftpos debit 0127176 apple\\apple.com/bill\\mv2nqkv1kda0	3299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.390111	2026-01-02 12:34:59.390111
e16be88d-b2ff-4f31-acce-e68a23e1524b	2025-09-04	deposit-osko payment 2540971 christopher lipman nbr 145 nbr 145	166650	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.395214	2026-01-02 12:34:59.395214
f0d51192-2c68-41f4-8a50-c9ae97d9c8e1	2025-09-04	deposit-osko payment 2975680 srb (nsw) pty ltd deposit installation maroubra nbr	316250	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.401537	2026-01-02 12:34:59.401537
751837ee-88e6-4519-9911-2eacfcd4665a	2025-09-04	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.40704	2026-01-02 12:34:59.40704
7f601cbf-4b5d-4eec-8ff5-3f6bd5806a11	2025-09-04	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.409991	2026-01-02 12:34:59.409991
48fa13bc-3480-4f9a-b41f-98b50b8a2731	2025-09-04	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.41463	2026-01-02 12:34:59.41463
0d5672a9-7385-4793-8afb-70d28fcb08a3	2025-09-05	deposit gary davies balanceinvoice 149	46750	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.417576	2026-01-02 12:34:59.417576
a9c41e5d-68c0-48ad-aeb3-f57acb230769	2025-09-05	debit card purchase woolworths 1103 lane cove aus card	1945	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.42406	2026-01-02 12:34:59.42406
2a59fc31-37b9-4e69-8daa-7dc69f5f77d9	2025-09-05	debit card purchase bunnings group ltd hawthorn eas aus	4823	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.431555	2026-01-02 12:34:59.431555
98830735-6eb5-4f70-89f5-f727f3535e9f	2025-09-08	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.434889	2026-01-02 12:34:59.434889
e1663b06-2a0d-4e7e-84de-2d8b0996a223	2025-09-08	debit card purchase bunnings group ltd hawthorn eas aus	4233	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.437722	2026-01-02 12:34:59.437722
1cffe4d5-cc96-48c7-9192-4ae53785c95c	2025-09-08	debit card purchase costco auburn lidcombe aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.4423	2026-01-02 12:34:59.4423
8aa2a420-6841-4315-acc2-21290e560960	2025-09-09	deposit-osko payment 2079437 fiona may deposit phillip bay nbr	340000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.449355	2026-01-02 12:34:59.449355
df95752c-e6db-4adf-8f2c-818295a210a8	2025-09-09	debit card purchase bunnings group ltd hawthorn eas aus	948	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.455943	2026-01-02 12:34:59.455943
70a202c9-bf6b-4592-b89a-d778a28a45b8	2025-09-09	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.459512	2026-01-02 12:34:59.459512
2d4f031b-e34a-4642-8e3f-aa6bdbcd7edc	2025-09-09	debit card purchase bunnings group ltd hawthorn eas aus	4437	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.463578	2026-01-02 12:34:59.463578
d35d1d09-6f38-436b-bdd9-67a35f1bf057	2025-09-09	withdrawal at stg atm merrylandnsw atm00538075203	40000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.467571	2026-01-02 12:34:59.467571
683df882-8d2f-42e7-bd7c-797b48b8e91a	2025-09-10	debit card purchase metro rosebery rosebery aus	1899	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.473803	2026-01-02 12:34:59.473803
76f07ebe-31af-49b4-b780-e63df3d57009	2025-09-10	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.480798	2026-01-02 12:34:59.480798
e46c1d35-b850-439f-9c3d-808d9190f21f	2025-09-10	debit card purchase bunnings group ltd hawthorn eas aus	2851	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.484387	2026-01-02 12:34:59.484387
205e7272-33cf-4624-9017-045cfb4afe6c	2025-09-10	debit card purchase inspire international eastgardens aus	3150	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.489701	2026-01-02 12:34:59.489701
12131a41-d4ef-40fe-a210-d717a22bc1ef	2025-09-10	debit card purchase bunnings group ltd hawthorn eas aus	7689	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.496913	2026-01-02 12:34:59.496913
103beff4-35e9-4493-a730-9b1f3aec497b	2025-09-10	eftpos debit 0322229 el jannah randwick randwick 10/09	4200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.50035	2026-01-02 12:34:59.50035
e82ee4cc-24c7-4fbf-81b9-b86701efb1a1	2025-09-10	eftpos debit 389637 fresh bowls and acai randwick 10/09	1115	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.506121	2026-01-02 12:34:59.506121
36279324-88f4-4d47-bef6-d3fef0701dda	2025-09-11	withdrawal-osko payment 1899884 mr top group pty ltd fiona	405350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.518422	2026-01-02 12:34:59.518422
238f6572-c612-4d53-944a-d1265d8d282e	2025-09-12	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.595265	2026-01-02 12:34:59.595265
b562f3d3-092c-439b-be0b-ce248dd99602	2025-09-12	debit card purchase kmart 1399 merrylands aus	7200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.599865	2026-01-02 12:34:59.599865
f702856a-a1d0-455b-9082-5d3b9192289f	2025-09-12	debit card purchase hogans wholesale wetherill pa aus	32461	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.605709	2026-01-02 12:34:59.605709
9f767a3b-8f32-4ff5-993b-94802452cc97	2025-09-12	debit card purchase walco aluminium pty south granvi aus	83911	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.617202	2026-01-02 12:34:59.617202
097fddea-2b57-4569-9e4d-dfe869ef37f9	2025-09-15	deposit-osko payment 2008659 frank abate invoice 154 sliding window	49500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.62508	2026-01-02 12:34:59.62508
5817d3be-3fbe-41a5-b164-86d8d6d64208	2025-09-15	deposit-osko payment 2989933 frank abate invoice 155	11000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.633096	2026-01-02 12:34:59.633096
590bb7c7-138d-4d49-bfa9-e7943424100d	2025-09-15	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.640087	2026-01-02 12:34:59.640087
8e3f89a4-9dfb-4eb7-a985-64fd4daa0abd	2025-09-15	debit card purchase costco auburn lidcombe aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.643691	2026-01-02 12:34:59.643691
3d568436-9bc2-4b7d-bd05-d72f006faad5	2025-09-15	debit card purchase ezi*biz cover (no.3) sydney aus	19079	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.650754	2026-01-02 12:34:59.650754
8d720c05-4bf7-421e-b05a-d16831c2d2a4	2025-09-15	withdrawal-osko payment 1206097 mr top group pty ltd	110000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.654102	2026-01-02 12:34:59.654102
cab2d1f1-897e-45bd-bf4d-164e4afccd98	2025-09-15	eftpos debit 0752099 el jannah randwick randwick	4200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.663046	2026-01-02 12:34:59.663046
31948be5-e173-49de-a61e-c0917a5b3601	2025-09-16	deposit-osko payment 2899716 t & h corby pty ltd nbr 261 trent lindfield lindfield	245036	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.669511	2026-01-02 12:34:59.669511
ea565712-2d67-4e22-b303-2e5766ecaa34	2025-09-16	debit card purchase eg group 1460 strathfield aus	700	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.676429	2026-01-02 12:34:59.676429
fafab683-bfc9-47ac-aff8-b7aad17797ab	2025-09-16	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.683461	2026-01-02 12:34:59.683461
558fff3d-475c-46e3-ae25-dd49544be3df	2025-09-16	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.686676	2026-01-02 12:34:59.686676
bd721903-6fdb-4414-8bb3-b3d2b11a051e	2025-09-16	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.689199	2026-01-02 12:34:59.689199
f3e6b24b-b8dd-4b1a-b842-62b4df42177f	2025-09-16	debit card purchase ampol coogee s 22392f south coogee aus	2450	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.692053	2026-01-02 12:34:59.692053
1c3319fc-cb39-480d-935e-4645a3daacf4	2025-09-16	debit card purchase bunnings group ltd hawthorn eas aus	3464	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.699261	2026-01-02 12:34:59.699261
fdaba1ca-ad0f-454f-8621-b3caa04d35b6	2025-09-16	withdrawal-osko payment 1856414 walco aluminium pty ltd q154065	76010	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.704197	2026-01-02 12:34:59.704197
6c9b6534-09ba-411d-add3-6cc9499d5ea5	2025-09-16	withdrawal-osko payment 1870354 walco aluminium pty ltd jessy cash account	196900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.709042	2026-01-02 12:34:59.709042
8484fd54-b9e3-43cd-a4a4-b37e48850d5c	2025-09-17	deposit-osko payment 2999322 fsf project pty ltd t/as urban fixx nbr 136 final payment nbr	155250	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.717292	2026-01-02 12:34:59.717292
7b637535-03f9-4dec-b5d4-1e945f6a5cde	2025-09-17	debit card purchase bunnings group ltd hawthorn eas aus	9834	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.724333	2026-01-02 12:34:59.724333
2478d95d-a774-4bcb-b069-c406246cb68e	2025-09-17	debit card purchase budget direct toowong aus	21339	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.730183	2026-01-02 12:34:59.730183
8109af46-7d93-4cdd-8b32-195aaa87acb3	2025-09-17	eftpos debit 0432073 el jannah  randwick randwick	4320	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.733204	2026-01-02 12:34:59.733204
c993db72-7b9f-49de-aa5e-d63120329993	2025-09-18	debit card purchase ampol coogee s 22392f south coogee aus	950	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.739189	2026-01-02 12:34:59.739189
c14dd9d4-ffd5-4353-8add-3c26eb77d838	2025-09-18	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.744723	2026-01-02 12:34:59.744723
1234e802-5c7c-4e72-a6ed-2d3aa8c3d4fa	2025-09-18	debit card purchase 7-eleven 2011 guildford we aus	4012	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.748477	2026-01-02 12:34:59.748477
22923487-db84-41ad-9f64-dfda075b45b9	2025-09-18	debit card purchase bunnings group ltd hawthorn eas aus	4736	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.754413	2026-01-02 12:34:59.754413
8fcdb607-4ba5-4fbf-8f9b-6697b6c405e7	2025-09-18	eftpos debit 0228337 reddy express 1605 forestville	300	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.758954	2026-01-02 12:34:59.758954
bf12a191-a55a-4fbf-b85c-21d82e2faaae	2025-09-19	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.765535	2026-01-02 12:34:59.765535
1b992b98-c8a6-4c9f-ac49-e9480580996a	2025-09-19	debit card purchase walco aluminium pty south granvi aus	18059	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.768552	2026-01-02 12:34:59.768552
8c50d59f-8f40-4563-a37f-0bc897bc1449	2025-09-22	debit card refund kennards hire ho nsw 1 seven hills aus	600	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.773857	2026-01-02 12:34:59.773857
30187366-50c6-4838-8254-28f083af49d8	2025-09-22	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.77692	2026-01-02 12:34:59.77692
67d3c5ed-a7da-48be-ae0e-815a303174c2	2025-09-22	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.781331	2026-01-02 12:34:59.781331
6474ae95-c433-4311-a095-b51395b8df1d	2025-09-22	debit card purchase shivom pty limited erskineville aus	3820	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.784963	2026-01-02 12:34:59.784963
facc5cd3-fd16-4625-90cc-7b4588e2e54e	2025-09-22	debit card purchase bunnings group ltd hawthorn eas aus	4263	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.789929	2026-01-02 12:34:59.789929
e0539ce3-0732-4377-82d5-22def50eac23	2025-09-22	debit card purchase kennards hire ho nsw 1 seven hills aus	7200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.793111	2026-01-02 12:34:59.793111
d6d494c3-a629-49db-9c9d-7f4f25e31afe	2025-09-22	debit card purchase costco auburn lidcombe aus	11848	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.800443	2026-01-02 12:34:59.800443
b6db1e6b-2d97-4af6-8c35-67fd56d40014	2025-09-22	debit card purchase zamzam village groce auburn aus	22447	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.805493	2026-01-02 12:34:59.805493
c8abc1ac-29f9-4af5-95ad-29f12dc1262b	2025-09-22	debit card purchase home improvement pages sydney	65890	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.808908	2026-01-02 12:34:59.808908
9409296f-be30-436e-a058-2a70ac6de76a	2025-09-22	eftpos debit 0089368 shell reddy express babass hill	600	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.813731	2026-01-02 12:34:59.813731
d1fefff0-9474-491c-b8d6-174007e6d1c8	2025-09-23	deposit-osko payment 2867570 christopher lipman nbr145 - st john rd glebe inv145	166650	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.819555	2026-01-02 12:34:59.819555
15583197-31ad-4a23-93c0-0618616a8713	2025-09-23	debit card purchase 7-eleven 2254 north ryde aus	600	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.824623	2026-01-02 12:34:59.824623
82e4f072-7728-40a6-adc9-4dfded4cc26f	2025-09-23	debit card purchase linkt sydeny sydney aus	2007	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.83127	2026-01-02 12:34:59.83127
409f4ac7-4965-4f48-a88c-e8cd77d7c22d	2025-09-23	debit card purchase linkt sydeny sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.834774	2026-01-02 12:34:59.834774
47daccd6-554c-4db4-a1cb-89fe7ca74980	2025-09-23	debit card purchase costco auburn lidcombe aus	33493	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.838255	2026-01-02 12:34:59.838255
bf945764-37c2-44e4-833e-f9bc2aec31b5	2025-09-23	withdrawal-osko payment 1244352 sydney skip bin guy	49000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.841606	2026-01-02 12:34:59.841606
29658d4a-322a-4673-991c-dba9ec5ae7a0	2025-09-24	withdrawal-osko payment 1109114 walco aluminium pty ltd sujal	82830	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.847911	2026-01-02 12:34:59.847911
f7831e91-3efa-442a-a3fb-40e38b6fcf12	2025-09-24	withdrawal-osko payment 1136464 walco aluminium pty ltd trent	94820	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.853045	2026-01-02 12:34:59.853045
10d223e2-4ccf-4105-94df-e4eee5a270cf	2025-09-24	eftpos debit 0188188 el jannah burwood burwood	4200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.857445	2026-01-02 12:34:59.857445
1e034951-894a-4a44-8c7b-d7f910d92760	2025-09-25	debit card purchase 7-eleven 2224 granville aus	1300	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.86433	2026-01-02 12:34:59.86433
c8377904-7164-4ede-b4bc-38ea165b387a	2025-09-25	debit card purchase linkt sydeny sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.870777	2026-01-02 12:34:59.870777
c0c17920-20d6-40b3-a1a7-1a8a2cb38ae1	2025-09-25	debit card purchase costco auburn lidcombe aus	8000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.874244	2026-01-02 12:34:59.874244
6aeb7fbb-5b62-4a54-9189-63f3774dc961	2025-09-25	withdrawal-osko payment 1583388 frank project cancellation	60500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.879492	2026-01-02 12:34:59.879492
ccfbd0a4-f80a-4c3e-89dc-d951b882ed90	2025-09-25	withdrawal mobile 1409963 pymt starr part house&workshop rent	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.888012	2026-01-02 12:34:59.888012
66fc80ca-f30a-4560-975c-d3091c730e92	2025-09-26	deposit-osko payment 2168787 mei kitty windows	190000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.891004	2026-01-02 12:34:59.891004
91a310f2-4a14-4ab7-af45-3b0d2a4c29e2	2025-09-26	debit card purchase costco auburn lidcombe aus	1797	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.896881	2026-01-02 12:34:59.896881
a18c3b9b-afb4-4779-b807-731dad8c7fa7	2025-09-26	debit card purchase costco auburn lidcombe aus	6248	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.904463	2026-01-02 12:34:59.904463
0a721a34-1469-48c5-ab0f-4969317530c4	2025-09-29	deposit-osko payment 2114290 aaa bayside homes pty ltd	70000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.910204	2026-01-02 12:34:59.910204
60d2c220-6225-4427-9221-3c930d90d52e	2025-09-29	deposit-osko payment 2145541 quoc tran huy	240790	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.918442	2026-01-02 12:34:59.918442
726abd85-02d2-4c72-a951-65498574f098	2025-09-29	deposit-osko payment 2638591 fiona may 25 on delivery plus timber reveals	269000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.924348	2026-01-02 12:34:59.924348
4d8512d1-3f84-44e4-a5e3-53860199edca	2025-09-29	debit card purchase costco auburn lidcombe aus	9918	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.931139	2026-01-02 12:34:59.931139
0ded684f-c00e-4125-a754-214835851961	2025-09-29	withdrawal-osko payment 1131313 a al-matari balance	4060	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.93647	2026-01-02 12:34:59.93647
58764a24-1184-4e25-b500-91904038f2f1	2025-09-29	withdrawal-osko payment 1133349 mr top group pty ltd sabriti	137500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.939972	2026-01-02 12:34:59.939972
3cce74c0-c011-4dd7-bc0b-0207eac2f051	2025-09-29	eftpos debit 0071762 reddy express 1572 northmead	3946	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.944803	2026-01-02 12:34:59.944803
73e76b83-6f80-4f14-9bdf-bd9ec960f5f1	2025-09-30	debit card refund bunnings group ltd hawthorn eas aus 	8398	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.947214	2026-01-02 12:34:59.947214
6982d6e9-d0a1-4ce4-b885-e572e5c8b999	2025-09-30	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.950809	2026-01-02 12:34:59.950809
0d5c16a5-64f6-46c0-ac4e-be5b538d9387	2025-09-30	debit card purchase bunnings group ltd hawthorn eas aus	8398	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.955376	2026-01-02 12:34:59.955376
826a2c0e-96b7-4b8e-a9b2-c1e2bf712565	2025-09-30	debit card purchase bunnings group ltd hawthorn eas aus	10429	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.958855	2026-01-02 12:34:59.958855
047d7e58-af08-4170-bfad-d4c31a6dfcc9	2025-09-30	withdrawal-osko payment 1542872 a al-matari	75000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.961909	2026-01-02 12:34:59.961909
b53f7bb4-008a-465a-bb68-0dd605a655a8	2025-10-01	debit card refund bunnings group ltd hawthorn eas aus 	9144	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.964583	2026-01-02 12:34:59.964583
18109c94-2491-4ed3-95ff-8d5e4a0f2022	2025-10-01	debit card purchase bunnings group ltd hawthorn eas aus	21336	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.967182	2026-01-02 12:34:59.967182
0f9c9162-ec5f-4370-a975-ec56de40bb52	2025-10-01	withdrawal-osko payment 1633587 mr top group pty ltd huy	214500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.973881	2026-01-02 12:34:59.973881
1ec07c86-029c-4897-ba8a-c1401e1540fb	2025-10-02	debit card refund bunnings group ltd hawthorn eas aus 	18200	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.978753	2026-01-02 12:34:59.978753
a1b50adf-b752-43c0-a45e-bdb2640ea5b7	2025-10-02	debit card purchase otr kingsford kingsfordsa aus	2478	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.981624	2026-01-02 12:34:59.981624
134e7792-db2b-4be8-9b20-b637db2a4bb3	2025-10-02	debit card purchase bunnings group ltd hawthorn eas aus	20330	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.984475	2026-01-02 12:34:59.984475
bf11a75e-c4f3-40a0-9b16-f73fad8ea82c	2025-10-02	debit card purchase bunnings group ltd hawthorn eas aus	28316	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.99345	2026-01-02 12:34:59.99345
66c74ab5-cb0a-4904-82b4-ad554b6b02bb	2025-10-02	withdrawal mobile 1582279 pymt starr part house&workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:34:59.999934	2026-01-02 12:34:59.999934
081dbb9b-97f1-47ce-baff-bc1e36551f34	2025-10-03	debit card purchase bunnings group ltd hawthorn eas aus	2816	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.004743	2026-01-02 12:35:00.004743
1ecf32e1-f051-4956-ac92-88e1e763d12f	2025-10-03	debit card purchase bunnings group ltd hawthorn eas aus	3029	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.010573	2026-01-02 12:35:00.010573
c11b21c4-fcd9-4a95-87af-a220e699c320	2025-10-06	debit card refund bunnings group ltd hawthorn eas aus 	9336	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.015874	2026-01-02 12:35:00.015874
d9a2003c-59e7-42cc-bfe3-4e901f3346a3	2025-10-06	debit card purchase dnh*godaddy #3906654318 sydney	4791	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.019196	2026-01-02 12:35:00.019196
20a97916-9cf6-4c44-b513-6edd1988cde2	2025-10-06	debit card purchase costco auburn lidcombe aus	10939	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.023336	2026-01-02 12:35:00.023336
75305809-842d-442e-956e-ffa24bbeb24b	2025-10-06	withdrawal mobile 1231976 bpay asic	10400	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.027284	2026-01-02 12:35:00.027284
fc4f9dd4-f1b6-4617-80aa-56a14df1017a	2025-10-07	debit card purchase super cheap aut auburn aus	8909	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.030429	2026-01-02 12:35:00.030429
687907a2-c2b3-40c7-a597-702b54e996b0	2025-10-07	debit card purchase ezi*biz cover (no.3) sydney aus	19079	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.033503	2026-01-02 12:35:00.033503
0e731e59-e38f-4968-a984-d5b5083fa021	2025-10-07	eftpos debit 0115953 coles 0762 ramsgate 07/10 card	535	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.038044	2026-01-02 12:35:00.038044
9fbf5575-f366-47a9-b2a6-5a9eedaab8fa	2025-10-08	deposit-osko payment 2932706 srb (nsw) pty ltd balance maroubra nbr 165	316200	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.041694	2026-01-02 12:35:00.041694
ca15ce99-d91a-4e89-91b8-3e2a1a159e5a	2025-10-08	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.049342	2026-01-02 12:35:00.049342
9b85abdf-af97-4798-b3e3-e9882ae2c60c	2025-10-08	withdrawal-osko payment 1956433 a&a flashing	24883	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.053318	2026-01-02 12:35:00.053318
74945352-5851-46b4-ac4b-500ec9a4c52c	2025-10-09	debit card refund complete lintels pty annagrove aus	19457	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.062013	2026-01-02 12:35:00.062013
91b8a5e5-165d-4fd5-b006-dea7d785f10a	2025-10-09	debit card purchase bunnings group ltd hawthorn eas aus	4560	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.065578	2026-01-02 12:35:00.065578
0066ad70-2429-4102-99d5-6f95ec1a250b	2025-10-09	debit card purchase syndey central locksmit north willou aus	28460	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.069295	2026-01-02 12:35:00.069295
28cde0ef-efae-4879-9827-484ccee9412b	2025-10-09	withdrawal mobile 1593952 pymt starr part house&workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.074854	2026-01-02 12:35:00.074854
08211edf-7ce5-455e-b1ab-a8c160581d26	2025-10-10	deposit-osko payment 2371071 tatla civil pty ltd invoice 161	121000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.078278	2026-01-02 12:35:00.078278
59df064c-9f4f-4201-81d5-a5aeddb05370	2025-10-10	deposit-osko payment 2603743 andrew batten andrew batten oatley	283630	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.085249	2026-01-02 12:35:00.085249
26312505-706e-45f7-9069-fab016bf1701	2025-10-10	debit card purchase costco auburn lidcombe aus	9793	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.093508	2026-01-02 12:35:00.093508
c3490054-5c30-44e3-b2ac-57f882817ce4	2025-10-13	deposit-osko payment 2814181 quoc tran huy	130000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.096904	2026-01-02 12:35:00.096904
86072349-082a-415f-94e2-be7dc7f7b17c	2025-10-13	debit card purchase bunnings group ltd hawthorn eas aus	1291	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.103034	2026-01-02 12:35:00.103034
d1b4a8d2-f2e5-4485-921e-d9cf9a4b524d	2025-10-13	debit card purchase bunnings group ltd hawthorn eas aus	1355	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.108254	2026-01-02 12:35:00.108254
df14446d-d0dc-4792-aac9-1f0e7f2a1b7f	2025-10-13	debit card purchase bunnings group ltd hawthorn eas aus	2582	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.112961	2026-01-02 12:35:00.112961
b68008f5-cdee-4a46-9a50-6282e9cac932	2025-10-13	debit card purchase 7-eleven 2214 minchinbury aus	3700	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.123569	2026-01-02 12:35:00.123569
dceaab0a-9920-4b97-94fa-c748156e8f6f	2025-10-13	withdrawal-osko payment 1068628 mr top group pty ltd andrew batten project 27	275000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.128317	2026-01-02 12:35:00.128317
6d97d4e3-3ca6-4c4e-b3a1-0f0d8b9cea87	2025-10-13	withdrawa-osko payment 183865 s sapkota	55000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.132927	2026-01-02 12:35:00.132927
cd6c6c6e-d135-48cd-92e7-43c8d29a4f60	2025-10-13	eftpos debit 0946052 el jannah randwick randwick	4200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.13905	2026-01-02 12:35:00.13905
cb3040c4-da7e-44d1-bafe-93b52ebf96a4	2025-10-14	deposit-osko payment 2758432 quoc tran huy	147900	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.142703	2026-01-02 12:35:00.142703
ece17227-66a3-4d5f-acd9-c1705fa1ea6d	2025-10-14	debit card refund bunnings group ltd hawthorn eas aus 	2848	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.150933	2026-01-02 12:35:00.150933
5878ea81-894d-4645-b5b4-25eabbe02d31	2025-10-14	debit card purchase vezina pl mascot aus	1745	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.153835	2026-01-02 12:35:00.153835
bf04bf9c-4da9-49a2-bca7-175a1866c1ae	2025-10-14	debit card purchase bunnings group ltd hawthorn eas aus	2848	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.15623	2026-01-02 12:35:00.15623
bce30e73-c4a5-4f16-9b16-4f13954b11fe	2025-10-14	debit card purchase bunnings group ltd hawthorn eas aus	3751	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.159023	2026-01-02 12:35:00.159023
71a8051a-181a-4cac-818e-7486529dbcba	2025-10-14	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.162906	2026-01-02 12:35:00.162906
b82a816b-933d-4fee-a1e8-88657b8947af	2025-10-14	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.16597	2026-01-02 12:35:00.16597
10ebece2-4342-4f43-8596-26f76678e6b7	2025-10-14	debit card purchase costco auburn lidcombe aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.169208	2026-01-02 12:35:00.169208
eb12532b-0455-4c2c-a241-b5a042a1be70	2025-10-15	deposit-osko payment 2751812 quoc tran huy	286000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.173065	2026-01-02 12:35:00.173065
21f726c5-7cd2-4746-81bb-49f936791432	2025-10-15	debit card purchase bunnings group ltd hawthorn eas aus	760	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.17947	2026-01-02 12:35:00.17947
f9201007-17af-4d18-b546-dfb175ceaf98	2025-10-15	debit card purchase bunnings group ltd hawthorn eas aus	2841	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.184324	2026-01-02 12:35:00.184324
a63b229d-f1ac-4538-8b42-e4c80e5ac257	2025-10-15	debit card purchase bunnings group ltd hawthorn eas aus	4280	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.188137	2026-01-02 12:35:00.188137
74656ed3-15a5-4998-8afe-a224b3520620	2025-10-15	debit card purchase bunnings group ltd hawthorn eas aus	4800	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.193232	2026-01-02 12:35:00.193232
4d0b48d1-1d2f-4f37-a76b-24acc113482b	2025-10-15	eftpos debit 0269475 munch express minto 15/10 card	1872	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.199039	2026-01-02 12:35:00.199039
1f7f33a0-2621-42f2-84ee-3cee31003ba1	2025-10-16	debit card purchase speedway west ryde west ryde aus	600	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.203945	2026-01-02 12:35:00.203945
79a8ff81-69aa-481d-959d-63bc2bd2a409	2025-10-16	debit card purchase speedway west ryde west ryde aus	800	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.206915	2026-01-02 12:35:00.206915
e79bbefb-220e-45f2-b30b-74b79d763493	2025-10-16	debit card purchase no 1 roofing & build regents park aus	4003	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.210109	2026-01-02 12:35:00.210109
6f29dc4a-e138-4285-9042-3e7274b4a7bf	2025-10-16	withdrawal mobile 1581467 pymt starr part house&workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.214033	2026-01-02 12:35:00.214033
90d556f3-0eaf-42d6-9b2a-9c384bb872fe	2025-10-16	eftpos debit 0074244 beddy express 1637 ryde north 16/10 ccard	379	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.219902	2026-01-02 12:35:00.219902
436a9881-935f-4ebb-9e55-b821da2651ab	2025-10-17	deposit-osko payment 2918144 trent corby 164	55000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.22256	2026-01-02 12:35:00.22256
8ed0532d-d388-468e-887d-f74362d18d86	2025-10-17	debit card purchase budget direct toowong aus	21339	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.22893	2026-01-02 12:35:00.22893
a00e1514-0de2-49b6-a2dc-9a8f545c361c	2025-10-17	debit card purchase yt aluminium australia milperra aus	14681	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.231607	2026-01-02 12:35:00.231607
c58998bd-496c-4be6-888d-815b9f055d20	2025-10-17	debit card purchase yt aluminium australia milperra aus	7000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.236725	2026-01-02 12:35:00.236725
a4cde1b2-f97e-417c-a22e-2ec0f83f02e1	2025-10-20	deposit-osko payment 2830721 skunsh pty ltd acn 106 104 107 aft deposit inv168	143000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.24088	2026-01-02 12:35:00.24088
1fe74551-87be-4f8b-bec8-47b3c8cf8347	2025-10-20	debit card purchase no 1 roofing & build regents park aus	533	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.246476	2026-01-02 12:35:00.246476
ed2d60b3-bec1-417f-b6a4-e22180e3e7a8	2025-10-20	debit card purchase no 1 roofing & build regents park aus	3756	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.252902	2026-01-02 12:35:00.252902
00e21bb5-d9dc-4ee9-bc6f-9e59e8ecaaaf	2025-10-20	debit card purchase bunnings group ltd hawthorn eas aus	7488	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.257523	2026-01-02 12:35:00.257523
1736fe42-d79f-447a-a0e0-e256705cb21f	2025-10-20	debit card purchase home improvement pages sydney	76890	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.262203	2026-01-02 12:35:00.262203
cc5357c4-6147-4931-b5a1-02e4790805f4	2025-10-21	deposit 2961639 bostock g funds transfer	226600	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.264988	2026-01-02 12:35:00.264988
03fc9368-7389-4b40-b119-28a37fb5da91	2025-10-21	debit card refund bunnings group ltd hawthorn eas aus 	9069	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.272014	2026-01-02 12:35:00.272014
68bfbd64-65a5-4716-a33c-eab10f571e00	2025-10-21	debit card purchase 7-eleven 2269 roseville aus	200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.27577	2026-01-02 12:35:00.27577
18d5d896-9428-4235-a0aa-106fc2481f4e	2025-10-21	debit card purchase fairfield petroleum fairfield aus	12128	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.27879	2026-01-02 12:35:00.27879
8cfd0b5b-60f4-499b-9b0b-c3027e14471f	2025-10-21	debit card purchase bunnings group ltd hawthorn eas	13547	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.28322	2026-01-02 12:35:00.28322
28e7e97e-047b-44b7-9ccc-81074d36690d	2025-10-21	debit card purchase bunnings group ltd hawthorn was aus	11436	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.287956	2026-01-02 12:35:00.287956
4d20474f-22c7-4bdd-abb1-34ecf38701d8	2025-10-21	bunngings refunded	9069	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.292822	2026-01-02 12:35:00.292822
c34e3d40-59bf-45ad-90ae-23c635ff5e1c	2025-10-22	debit card purchase speedway west ryde west ryde aus	400	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.295793	2026-01-02 12:35:00.295793
0bf5e36f-7711-406a-b4b3-a6bfcf0d6780	2025-10-23	withdrawal mobile 1415545 pymt starr part house&workshop rent	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.300074	2026-01-02 12:35:00.300074
3e6b9ee1-792c-4341-9e22-97d7e51e895b	2025-10-24	debit card purchase bunnings group ltd hawthorn eas aus	9002	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.30319	2026-01-02 12:35:00.30319
db1630d6-5589-4997-9233-d39db1c7b3b3	2025-10-27	deposit-osko payment 2781615 andrew batten andrew #160	283630	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.306052	2026-01-02 12:35:00.306052
e06a745f-5588-4b2c-a60d-ff64362321cc	2025-10-27	debit card purchase bunnings 586000 south nowra aus	2150	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.312887	2026-01-02 12:35:00.312887
f4fc4268-92db-449d-83ad-6b9bdcc2d9c7	2025-10-27	withdrawal-osko payment 1148515 a al-matary salary 26 oct 2025	60000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.323058	2026-01-02 12:35:00.323058
9a3bd82f-4654-497b-8595-5a14e4ec096f	2025-10-27	withdrawal-osko payment 1738111 a al-matari 25 oct 2025	17950	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.327465	2026-01-02 12:35:00.327465
ff511b26-4834-4c26-bc85-05c3a607636a	2025-10-27	withdrawal-osko payment 1869214 mr top group pty ltd sean project 31 26 oct 2025	238700	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.330589	2026-01-02 12:35:00.330589
c0ef4bab-669e-4d26-9cd6-0518e355b362	2025-10-28	deposit-osko payment 262549 ms claudia elizbeth allcroft claudia allcroft	125000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.336971	2026-01-02 12:35:00.336971
0c109bd2-e546-4b38-ac8d-4e8aece20230	2025-10-29	debit card purchase 7-eleven 2269 roseville aus	1225	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.342468	2026-01-02 12:35:00.342468
c0fb1706-d963-40cd-976d-44bf7164cb23	2025-10-29	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.345226	2026-01-02 12:35:00.345226
99e0f749-8aea-4b34-ab26-4043638a77fe	2025-10-29	debit card purchase costco auburn lidcombe aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.347556	2026-01-02 12:35:00.347556
8fad93e9-d454-4b9b-96a9-dbabcef9b200	2025-10-30	deposit-osko payment 2381546 paris esmaeli matanagh quote 302	192500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.352568	2026-01-02 12:35:00.352568
d6b3edc8-5975-4f1d-ab68-e5fcec362786	2025-10-30	withdrawal mobile 1489622 paymt starr part house&workshop rent	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.359709	2026-01-02 12:35:00.359709
c93c2fb6-e9f1-4848-b861-abe0ee0c0e9c	2025-10-31	withdrawal-osko payment 1757904 n ruan balance for macbook air	2000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.362901	2026-01-02 12:35:00.362901
acfc750d-c056-455e-89e4-f84ad450b455	2025-11-03	debit card purchase yt aluminium australia milperra aus	935	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.367123	2026-01-02 12:35:00.367123
5b1c35ff-92da-46ea-be7d-83d0d1f8e01e	2025-11-03	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.372089	2026-01-02 12:35:00.372089
d1a56d91-6dbf-47b4-ba12-fb74693ef574	2025-11-03	debit card purchase costco auburn lidcombe aus	11596	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.375545	2026-01-02 12:35:00.375545
0283753e-f130-4725-813c-f08cf9d60eab	2025-11-03	debit card purchase yt aluminium australia milperra aus	16445	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.378673	2026-01-02 12:35:00.378673
48d6e5c3-3068-4ae8-ac02-46197eb53276	2025-11-03	debit card purchase yt aluminium australia milperra aus	20031	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.38524	2026-01-02 12:35:00.38524
8aa418c0-0c55-48ae-87ac-815018dac7da	2025-11-03	debit card purchase costco auburn lidcombe aus	26999	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.390292	2026-01-02 12:35:00.390292
d8b15a34-ae83-4496-bbc3-f9399f5d32ab	2025-11-03	debit card purchase ato payment sydney aus	78100	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.394342	2026-01-02 12:35:00.394342
db33c05a-bfb0-49b8-89b9-c029a8665c58	2025-11-03	withdrawal-osko payment 1123100 mr top group pty ltd retractable flatscreen	50600	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.398372	2026-01-02 12:35:00.398372
bb24d610-7714-4f8c-be44-2beb45592057	2025-11-03	withdrawal-osko payment 1300228 a al-matari salary	80000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.403668	2026-01-02 12:35:00.403668
d050fdcc-ff86-4caa-a956-72a9b79248c6	2025-11-04	deposit maxwell grant su max sutherland	45000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.40641	2026-01-02 12:35:00.40641
35cb3f94-ce9a-49be-8d86-e84b1d2727e3	2025-11-04	eftpos debit 0076095 sq *oliver brown merrymerrylands	698	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.41263	2026-01-02 12:35:00.41263
4dee55c1-45e6-46b0-a49c-f02eb8be61c4	2025-11-05	debit card purchase speedway roseville roseville aus	650	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.417944	2026-01-02 12:35:00.417944
5b546264-38c1-44db-a4d2-f13413c07705	2025-11-05	debit card purchase apple.com/bill sydney aus	3299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.421444	2026-01-02 12:35:00.421444
70091eb0-96e3-48e6-b242-9b377a0dbb66	2025-11-05	debit card purchase jb hi fi merrylands merrylands aus	4995	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.424435	2026-01-02 12:35:00.424435
2087a24e-b336-4bd1-a01f-f63238a01579	2025-11-05	debit card purchase ezi*biz cover (no.3) sydney aus	19079	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.427576	2026-01-02 12:35:00.427576
378bf8f5-8aae-4a5e-80ce-0632c77c3b28	2025-11-05	withdrawal-osko payment 1877364 walco aluminium pty ltd safi	154000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.429962	2026-01-02 12:35:00.429962
18ed6323-3c02-4cad-8146-1b3e26e376b8	2025-11-05	withdrawal-osko payment 1878185 walco aluminium pty ltd claudia	93500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.435777	2026-01-02 12:35:00.435777
56443dba-a4e9-493d-9923-1f1139249ec6	2025-11-05	withdrawal-osko payment 1998187 walco aluminium pty ltd max	216150	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.44084	2026-01-02 12:35:00.44084
2d55686d-fc77-4ee3-aae1-209e4d0113a7	2025-11-06	deposit-osko payment 2279549 auzzy projects 170	184800	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.446039	2026-01-02 12:35:00.446039
e3408a50-2b68-4ab9-9def-c521bae825aa	2025-11-06	debit card purchase costco wholesale pty lidcombe aus	1797	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.453437	2026-01-02 12:35:00.453437
74dd237c-4b63-4a22-b80c-5e9a10efda0b	2025-11-06	withdrawal-osko payment 1231974 a al-matari salary	80000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.456084	2026-01-02 12:35:00.456084
55fe598c-d7d4-4a76-a8a4-a2ae70221dae	2025-11-06	withdrawal mobile 1450848 pymt starr part house & workshop rent	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.459929	2026-01-02 12:35:00.459929
a2e86424-481c-4822-ae8e-f60e3b94422c	2025-11-07	deposit-osko payment 2023463 marisa newham flyscreens for m newham	65000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.463291	2026-01-02 12:35:00.463291
fa6f4298-cb91-48dd-bae3-a4c3d39018c3	2025-11-10	deposit-osko payment 2018763 skunsh pty ltd acn 106 104 107 atf blind terry hills inv168	143000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.47123	2026-01-02 12:35:00.47123
123513f9-8f7e-45f5-8719-d1eb033e2425	2025-11-10	deposit-osko payment 2160925 jack march christine	30000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.478022	2026-01-02 12:35:00.478022
50ff78a9-708d-436c-8b75-b8855673e11b	2025-11-10	deposit-osko payment 2545877 rafael defritz nbr 174 - 19 caperbush melonba	93500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.484962	2026-01-02 12:35:00.484962
87e85c15-1060-4603-abf4-ce4a13bc1dc9	2025-11-10	debit card purchase costco auburn lidcombe aus	11571	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.491054	2026-01-02 12:35:00.491054
8d5b6644-e9e9-44c2-8b68-a87afdc53222	2025-11-10	eftpos debit 0341104 hungry jacks woolloomooloo	1760	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.494579	2026-01-02 12:35:00.494579
f946bb86-3f7c-474a-b9aa-812c89852fe2	2025-11-10	eftpos debit 0923302 subway minchinbury 1b colyton ro	2020	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.497247	2026-01-02 12:35:00.497247
2c496bd1-d92b-4f82-91dd-3b24d705daa6	2025-11-11	deposit-osko payment 2309139 christopher hole inv 178 deposit	162250	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.50165	2026-01-02 12:35:00.50165
76203c33-0717-4f88-9ff0-07d6a2cf7f30	2025-11-11	deposit-osko payment 2764068 skunsh pty ltd acn 106 104 107 atf inv179	93500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.506869	2026-01-02 12:35:00.506869
380ff467-e311-456b-b2b2-43c6367e27bf	2025-11-11	debit card purchase mcdonalds west ryde west ryde aus	3225	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.513576	2026-01-02 12:35:00.513576
4298faa3-2410-4c80-a2b2-6670fecc9e06	2025-11-11	debit card purchase bunnings group ltd hawthorn eas aus	5064	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.522482	2026-01-02 12:35:00.522482
6dc29041-4b03-4f60-a572-1efd2a1f0131	2025-11-11	debit card purchase bunnings group ltd hawthorn eas aus	10355	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.526729	2026-01-02 12:35:00.526729
68572b80-a40f-4db1-87c7-6e50a135afa9	2025-11-12	deposit-osko payment 2791237 auzzy projects 170	184800	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.530965	2026-01-02 12:35:00.530965
08bacab2-a404-4809-9e68-75a37cb8a8fd	2025-11-12	deposit 2097244 bostock g funds transfer	226600	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.538635	2026-01-02 12:35:00.538635
803b55e6-db1d-4329-a3d3-cb74b4731413	2025-11-12	debit card purchase bunnings group ltd hawthorn eas aus	7776	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.544757	2026-01-02 12:35:00.544757
bd4b95ee-67fd-40f6-b64a-4f9067bbe75c	2025-11-13	withdrawal-osko payment 1860708 a al-matari salary	100000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.552547	2026-01-02 12:35:00.552547
981d3f3d-0a84-4b8e-b418-4cd530a9d561	2025-11-13	withdrawal mobile 1533880 pymt starr part house & workshop rent	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.556546	2026-01-02 12:35:00.556546
9dabe269-3b74-499f-b294-f4e20d541b04	2025-11-14	deposit-osko payment 2619919 skunsh pty ltd acn 106 104 107 aft inv179	93500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.55938	2026-01-02 12:35:00.55938
2b300b88-b0d2-4ad6-8cef-497292f46378	2025-11-14	withdrawal-osko payment 1904752 a al-matari salary	50000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.564609	2026-01-02 12:35:00.564609
b763f569-6215-48b9-9c98-d13ecb2e81a9	2025-11-17	debit card purchase costco auburn lidcombe aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.567987	2026-01-02 12:35:00.567987
144dfcb6-1054-4f75-82eb-1c4f4a492626	2025-11-17	debit card pruchase bunnings ltd hawthorn eas aus	34925	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.573095	2026-01-02 12:35:00.573095
72f6c755-3289-4bb6-bdeb-640380b315e1	2025-11-17	debit card purchase home improvement pages sydney	76890	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.57655	2026-01-02 12:35:00.57655
e3909f53-479a-473a-86a4-4f70b06b32a4	2025-11-17	withdrawal-osko payment 1505040 mr top group pty ltd fiona window remake measuring issue	45000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.579339	2026-01-02 12:35:00.579339
d22c7d1c-75a5-47a4-a8bc-81f3739c52f0	2025-11-17	withdrawal-osko payment 1563729 mr top group ltd rafael	6000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.583805	2026-01-02 12:35:00.583805
bd7a1180-9ce6-42b7-8d28-0f4352795f42	2025-11-17	withdrawal-osko payment 1576640 mr top group pty ltd christine window fly frame	5500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.589859	2026-01-02 12:35:00.589859
1c2573da-4000-4d8b-bbdb-c04a3aac926e	2025-11-17	withdrawal-osko payment 1583133 mr top group pty ltd retractable paul mckenna	51000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.5945	2026-01-02 12:35:00.5945
5a23496c-05c7-4024-80f5-e683e209c271	2025-11-17	withdrawal-osko payment 1587054 mr stop group pty ltd chris hole bifold hardware	49500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.598443	2026-01-02 12:35:00.598443
73b2243a-3561-4bd8-a9f5-1c20d1bb92c7	2025-11-17	withdrawal-osko payment 1598320 mr top group pty ltd andrew pet door	22000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.604719	2026-01-02 12:35:00.604719
e7fe2b5b-1b9d-4329-80e3-9dd4e42b6034	2025-11-18	debit card purchase budget direct toowong aus	21339	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.610692	2026-01-02 12:35:00.610692
f54ce55d-0009-4fe5-aa26-d7d0cf0b0ab7	2025-11-18	debit card purchase yt aluminium australia milperra aus	30800	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.613206	2026-01-02 12:35:00.613206
e8868ece-70a4-4481-8442-a57c23913f14	2025-11-19	deposit-osko payment 2184210 paris esmaeili matanagh quote 302 quote 302 siavash safi	192500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.61798	2026-01-02 12:35:00.61798
61a89755-ca06-4ef6-91bb-6ffbbbfa7b69	2025-11-19	debit card purchase iga dulwich hill dulwich hill aus	250	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.625705	2026-01-02 12:35:00.625705
2fb20dde-e422-4ecf-8235-df13b5108e41	2025-11-19	debit card purchase bunnings group ltd hawthorn eas aus	1785	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.629253	2026-01-02 12:35:00.629253
853bcc99-0ffa-4020-bb3a-fa164341e6a5	2025-11-20	deposit-osko payment 2527591 ahmed mohammed al-matari refunc from bunnings purchase be refunded in december	14155	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.633748	2026-01-02 12:35:00.633748
829c3948-e529-4865-a977-960084da147f	2025-11-20	deposit online 2203467 pymt kellie goo deposit goodall	60000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.637971	2026-01-02 12:35:00.637971
0d4443ff-8e7a-482e-ada5-b2a67e4b3e71	2025-11-20	debit card purchase yt aluminium australia milperra aus	1848	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.644048	2026-01-02 12:35:00.644048
f891767d-de7f-46df-80a7-062535944e0d	2025-11-20	debit card purchase yt aluminium australia milperra aus	2024	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.647651	2026-01-02 12:35:00.647651
fd660fb0-92ea-4a30-bfa6-8928b61d7720	2025-11-20	debit card purchase yt aluminium australia milperra aus	3036	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.652254	2026-01-02 12:35:00.652254
9478d6ff-a134-4a67-b6be-059ec499c4dd	2025-11-20	debit card purchase 7-eleven 2011 guildford we aus card no. ~045253	3850	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.658273	2026-01-02 12:35:00.658273
a7822c67-a232-4a46-888c-97abd51a669f	2025-11-20	debit card purchase costco marsden park marsden park aus	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.661858	2026-01-02 12:35:00.661858
b9af6850-30d9-4b83-baff-84e452478a15	2025-11-20	debit card purchase bunnings group ltd hawthorn eas aus	14155	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.664608	2026-01-02 12:35:00.664608
f34a3c12-0038-48e9-b562-7b39cfb14c87	2025-11-20	debit card purchase bunnings group ltd hawthorn eas aus	3610	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.667553	2026-01-02 12:35:00.667553
076f671a-7bce-485f-8023-3cf26d559890	2025-11-20	debit card purchase bunnings group ltd hawthorn eas aus	38850	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.67033	2026-01-02 12:35:00.67033
e24c0164-9422-4d22-8fee-84653b65e5a9	2025-11-20	withdrawal osko payment 1542484 shienny andriany refund cancellation raphael	93500	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.674963	2026-01-02 12:35:00.674963
0e02b16d-0bc0-4a6e-9e7a-1fa565582a46	2025-11-20	withdrawal mobile 151894 pymt starr part house&workshop rent	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.682015	2026-01-02 12:35:00.682015
756a07d4-cfbe-4f27-afbc-10e9ad0990dd	2025-11-24	debit card purchase bakir sweet secret ice granville aus	610	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.688	2026-01-02 12:35:00.688
1d290e5c-af9b-4a91-93b5-b9e35cf1c17a	2025-11-24	debit card purchase bunnings group ltd hawthorn eas aus	1705	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.692676	2026-01-02 12:35:00.692676
a3e606ca-42e3-4d37-835c-ab7843a396be	2025-11-24	debit card purchase bondi roads seafoods bondi aus	1883	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.697324	2026-01-02 12:35:00.697324
33111bf4-f307-4009-877c-0ed6b43f8812	2025-11-24	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.700445	2026-01-02 12:35:00.700445
7339d1b1-515e-4d15-a1ca-e2333de758ea	2025-11-24	debit card purchase sydney central locksmi north willou aus	42008	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.703926	2026-01-02 12:35:00.703926
1eef26c5-3037-4e01-ae14-7da00af3c11d	2025-11-24	debit card purchase sydney central locksmi north willou aus	35000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.709932	2026-01-02 12:35:00.709932
4718c0d3-2b4b-42be-9b6a-53a5d54840c8	2025-11-24	withdrawal-osko payment 1360230 a al-matari salary	100000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.714923	2026-01-02 12:35:00.714923
ffbce84e-2c7a-4095-aa6d-0277c0fc2231	2025-11-24	eftpos debit 0119990 officeworks 0239 old guildford	528	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.727751	2026-01-02 12:35:00.727751
d65c914d-b0d7-4994-bdf7-d79ea695c9bb	2025-11-25	deposit-osko payment 2929988 empire constructions sydney pty ltd melrose fron door install	121000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.73327	2026-01-02 12:35:00.73327
0bfa756a-e1b1-4229-ba12-b5c84dc97889	2025-11-25	debit card purchase bunnings group ltd hawthorn eas aus	998	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.73902	2026-01-02 12:35:00.73902
dab38e85-12ad-41ab-a56c-fc19c5868a73	2025-11-25	debit card purchase costco auburn lidcombe aus	11885	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.742064	2026-01-02 12:35:00.742064
609a25cb-1a5a-4739-9e06-f6d2507367af	2025-11-25	payment by authority to oz education gui	30105	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.74659	2026-01-02 12:35:00.74659
d1c8e390-cd5e-4571-9a44-0210da6c476f	2025-11-26	deposit-osko payment 2605077 auzzy projects	126500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.749723	2026-01-02 12:35:00.749723
bbf470ab-bf62-4eb4-bb3b-b4f537912239	2025-11-26	debit card purchase bunnings group ltd hawthorn eas aus	758	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.75563	2026-01-02 12:35:00.75563
304edc99-1e5d-478b-9d5d-8ae385875b9f	2025-11-26	debit card purchase bunnings group ltd hawthorn eas aus	2052	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.760055	2026-01-02 12:35:00.760055
201264df-6de9-4cd2-b9b8-393209cda911	2025-11-26	debit card purchase bunnings group ltd hawthorn eas aus	5872	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.765463	2026-01-02 12:35:00.765463
df36e0e8-2880-4abf-8020-69c79f7b939f	2025-11-27	deposit-osko payment 2130442 auzzy projects 186	126500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.77037	2026-01-02 12:35:00.77037
ba8c15fa-c6d7-45b7-918b-1af5e31cbccc	2025-11-27	debit card purchase kennards hire ho nsw 2 seven hills aus	7200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.776505	2026-01-02 12:35:00.776505
09d4f3ee-3830-457e-a3c1-2b5eb1f28f1b	2025-11-27	withdrawal-osko payment 1820470 chris hole refund for bifold hardware repair	141250	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.783508	2026-01-02 12:35:00.783508
629fca95-6add-40bd-b5de-773161a13d8d	2025-11-27	withdrawal mobile 1516605 pymt starr part house&workshop	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.788836	2026-01-02 12:35:00.788836
5ecb5319-8d16-4d66-bbf3-d8e23213a26f	2025-11-28	debit card purchase linkt sydney sydney aus	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.797756	2026-01-02 12:35:00.797756
822deae8-3c5a-4e50-a072-ddab07ecb713	2025-11-28	debi card purchase bunnings group ltd hawthorn eas aus	6214	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.800849	2026-01-02 12:35:00.800849
f274781b-7ac7-4c40-baee-f065b34f5dc1	2025-11-28	withdrawal-osko payment 1690043 a al-matari good ampol station aussy project ah	2770	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.805266	2026-01-02 12:35:00.805266
bf321307-eb6c-49e0-8f80-22688f69b28c	2025-11-28	eftpos debit 0119910 speedway woodpark woodpark	350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.808019	2026-01-02 12:35:00.808019
d6c7935e-f995-407b-b7ea-222a70ad8c2a	2025-12-01	debit card refund sydney central locksmi north willou aus	53784	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.811315	2026-01-02 12:35:00.811315
bf6cc3e8-1601-4f48-bd51-fdaab61e461a	2025-12-01	deposit d and s built pt inv	858000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.818643	2026-01-02 12:35:00.818643
07c61df8-2afb-4260-a7af-3f2e349aab87	2025-12-01	debit card purchase mcdonalds w/wthville wentworthvil aus	835	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.823359	2026-01-02 12:35:00.823359
e27b2b84-a3bf-4056-8ee5-6ebd52105708	2025-12-01	debit card purchase bunnings group ltd hawthorn eas aus	1912	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.826955	2026-01-02 12:35:00.826955
ddd6a85b-f266-4683-bf5a-42bbf9c5920d	2025-12-01	debit card purchase bunnings group ltd hawthorn eas aus	5240	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.832709	2026-01-02 12:35:00.832709
ddc89c81-8448-46de-961d-2f53c0e88ddc	2025-12-01	debit card purchase costco auburn lidcombe aus	12000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.837575	2026-01-02 12:35:00.837575
3f618807-fbe2-453e-8f3a-6719fed07ecc	2025-12-01	debit card purchase sydney central locksmi north willou aus	37224	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.840516	2026-01-02 12:35:00.840516
da8200e6-ba75-4445-9558-98caa7ff3d4a	2025-12-01	debit card purchase sydney central locksmi north willou aus	37296	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.846177	2026-01-02 12:35:00.846177
4ed8f18e-ad58-430e-b98e-2a25a4a27cdf	2025-12-01	withdrawal-osko payment 1084028 a al-matari expenses	91595	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.851007	2026-01-02 12:35:00.851007
7ba995e4-f5d0-4c76-9681-c6c9c7312940	2025-12-01	withdrawal-osko payment 1361314 a al-matari expenses	60000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.854366	2026-01-02 12:35:00.854366
d5417f5c-85b7-4c0c-a321-aeba0b086074	2025-12-01	withdrawal-osko payment 1539756 latasha anthes car repair business meeting tax fed	50000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.857502	2026-01-02 12:35:00.857502
554e63c3-bde5-44a5-84f1-812502f23ebc	2025-12-01	eftpos debit 0463563 yt aluminium austral iamilperra	29491	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.864413	2026-01-02 12:35:00.864413
f64cff6f-a9e2-40dc-ae22-c2a66163b468	2025-12-01	eftpos debit 0541054 yt aluminium austral iamilperra	3080	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.869381	2026-01-02 12:35:00.869381
a6d689dc-4339-4046-89f5-77a0fc22f36c	2025-12-01	eftpos debit 0848128 subway minchinbury 1b colyton ro	1350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.874232	2026-01-02 12:35:00.874232
0093ff5d-d251-431e-a45c-d137b7f5ad92	2025-12-02	debit card purchase bunnings group ltd hawthorn eas aus	3230	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.877386	2026-01-02 12:35:00.877386
cbfd9756-804d-422a-9d53-3c6f365640a0	2025-12-02	withdrawal-osko payment 1714299 a al-matari expenses	40000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.881608	2026-01-02 12:35:00.881608
7cf73b51-cc9a-4303-ba91-1b258cc56e42	2025-12-03	deposit-osko payment 2347083 skunsh pty ltd acn 106 104 107	46750	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.884894	2026-01-02 12:35:00.884894
ae1eb374-87ad-4ac4-ac4e-82979fdd7a76	2025-12-03	debit card purchase apple.com/bill sydney aus	3299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.890152	2026-01-02 12:35:00.890152
71e9e7c5-7fd6-4ceb-a767-03f26f0a7401	2025-12-03	debit card purchase bunnings group ltd hawthorn eas aus	3900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.893866	2026-01-02 12:35:00.893866
56860a35-7f84-43d4-9f63-2915bb3a23dc	2025-12-04	withdrawal mobile 1520998 pymt starr part house&workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.898037	2026-01-02 12:35:00.898037
9054f63b-0cae-4d23-bea5-20df0d3fbedc	2025-12-05	debit card refund kennards hire ho nsw 1 seven hills aus	1400	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.901636	2026-01-02 12:35:00.901636
3ccee23f-3ec6-4f62-9c16-31b5d7e2d91a	2025-12-05	debit card refund sydney central locksmi north willou aus	6272	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.908908	2026-01-02 12:35:00.908908
40ae87b6-39c6-4e8a-91cd-fbb140bf1a4e	2025-12-05	debit card purchase ampol pendle hi 22707f pendle hill aus	600	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.914906	2026-01-02 12:35:00.914906
c32ace8f-63de-4be0-9ce1-6467398caec8	2025-12-05	debit card purchase sydney central locksmi north willou aus	676	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.922656	2026-01-02 12:35:00.922656
029d0087-52de-4072-8495-e7eb7511b999	2025-11-27	withdrawal-osko payment 1328609 a al-matari cash account	20000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.791988	2026-01-02 12:35:00.791988
24361afb-1461-4e85-8d61-0bb479af4017	2025-12-05	debit card purchase kennards hire ho nsw 2 seven hills aus	6000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.927507	2026-01-02 12:35:00.927507
1cda14d9-497e-4eca-a793-a86bcbfa6e8c	2025-12-05	debit card purchase sydney central locksmi north willou aus	6272	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.933924	2026-01-02 12:35:00.933924
b179253b-7a3e-4736-9bbe-e2da88fffa59	2025-12-05	debit card purchase sydney central locksmi north willou aus	7056	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.939927	2026-01-02 12:35:00.939927
431576a0-e1e7-46c2-9572-0fd008122faa	2025-12-05	debit card purchase costco auburn lidcombe aus	13258	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.944323	2026-01-02 12:35:00.944323
36b11529-155f-4fcb-bea7-b3fe9d07dca2	2025-12-05	debit card purchase ezi*biz cover (no.3) sydney aus	19079	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.947271	2026-01-02 12:35:00.947271
90771a01-27ab-4781-93fb-dc42043c3805	2025-12-05	withdrawal-osko payment 1598608 mr top group pty ltd deposit for the job 12 saunders rd	1000000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.951871	2026-01-02 12:35:00.951871
c70462a5-6188-45a1-a3a2-98bcc1394d17	2025-12-05	eftpos debit 0186823 sq *yemen gate resta urlakemba	17609	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.956007	2026-01-02 12:35:00.956007
b3a332db-650a-4c85-8d97-febd945594c3	2025-12-08	debit card purchase ampol lilli 22453f lilli pilli aus	2350	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.959521	2026-01-02 12:35:00.959521
2fe7e722-2745-4f6e-8cdc-27a20bf0b187	2025-12-08	debit card purchase big w online bellavista aus	3958	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.962753	2026-01-02 12:35:00.962753
a8507827-f7df-40f0-8215-9672d879e774	2025-12-08	debit card purchase bunnings group ltd hawthorn eas aus	11959	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.966614	2026-01-02 12:35:00.966614
4041c3df-8239-465a-9da8-976dbfcbf168	2025-12-08	withdrawal-osko payment 1743563 a al-matari expenses	50000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.971153	2026-01-02 12:35:00.971153
34271ca3-a746-4bc5-827c-9a0e3184dcbb	2025-12-09	debit card refund bunnings group 423000 bankswtown aus	947	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.973838	2026-01-02 12:35:00.973838
8d47d2aa-2c40-4191-befd-e5a8f58f3eda	2025-12-09	debit card purchase 7-eleven 2171 south hurstv aus	700	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.981549	2026-01-02 12:35:00.981549
d26d8df4-d145-4148-bded-e3af647ad7bf	2025-12-09	debit card purchase apple.com/bill sydney aus	2299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.98527	2026-01-02 12:35:00.98527
255c0efc-5c5d-4412-9384-5f8ddda101f7	2025-12-09	debit card purchase bunnings 548000 smithfield aus	5947	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.987961	2026-01-02 12:35:00.987961
1f7159b3-d5a9-4ef9-9a9b-643b6103f4ea	2025-12-09	debit card purchase bunnings group ltd hawthorn eas aus	43605	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.990596	2026-01-02 12:35:00.990596
ed93e5ac-c379-4c99-bf11-8148a6173b50	2025-12-09	debit card purchase bunnings group ltd hawthorn eas aus	9792	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.99372	2026-01-02 12:35:00.99372
939c254d-b0d9-41cc-aef4-b1a20b8b3495	2025-12-09	payment by authority to oz education gui	72105	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:00.996317	2026-01-02 12:35:00.996317
5a6b7aea-a26b-4873-82a7-59f4e4caba9b	2025-12-10	deposit-osko payment 2011869 auzzy projects	137500	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.000243	2026-01-02 12:35:01.000243
09ac3a77-5eca-42c3-abf1-ca81611c5316	2025-12-10	debit card refund bunnings group ltd hawthorn eas aus 	43605	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.006844	2026-01-02 12:35:01.006844
f1c2c040-e52c-4379-97f6-10fb90959a32	2025-12-10	debit card purchase bunnings group ltd hawthorn eas aus	2328	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.010147	2026-01-02 12:35:01.010147
e31ee744-6259-4b7d-bcab-655191ae6c27	2025-12-10	eftpos debit 0923089 aldi stores 0404 miranda	836	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.013165	2026-01-02 12:35:01.013165
99b7fe9d-95cf-470c-ad9d-bfd1bd877618	2025-12-11	debit card purchase sulai fast food pty lt miranda aus	3650	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.017316	2026-01-02 12:35:01.017316
1b4d961c-4b53-41b2-a32e-e4eef2872920	2025-12-11	debit card purchase kennards hire ho nsw 2 seven hills aus	5900	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.020342	2026-01-02 12:35:01.020342
b826c834-d282-4906-9900-180c25ec4a50	2025-12-11	withdrawal mobile 1572517 pymt starr part house&workshop rent	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.025125	2026-01-02 12:35:01.025125
d1319b0a-b0b5-4adf-ab37-e8b613dafe56	2025-12-11	eftpos debit 0126379 speedway woodpark woodpark	12435	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.029073	2026-01-02 12:35:01.029073
17256d55-43f1-4727-9f8d-d16224cced27	2025-08-08	withdrawal-osko payment 1020702 a al-matari	420000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 13:12:28.600146	2026-01-02 13:12:28.600146
58307ff6-4b25-4408-951c-25a47c4fd8bf	2025-08-25	withdrawal at bblsatm guildford 20212214022103 240825	50000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 13:13:31.168753	2026-01-02 13:13:31.168753
a94c8473-985f-41dc-8751-14ece86168c7	2025-08-26	deposit-osko payment 2182997 ahmed mohammed al-matari cash withdrawals removals removalist	50000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 13:13:46.630095	2026-01-02 13:13:46.630095
06bb3b2d-6532-48b8-952c-0134430eb27d	2025-09-01	deposit-osko payment 2800431 ahmed mohammed al-matari load	15670	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 13:15:05.421025	2026-01-02 13:15:05.421025
953e65fc-f254-464e-9010-337a9583e11f	2025-11-13	debit card purchase apple.com/bill sydney aus	1599	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 13:15:38.758214	2026-01-02 13:15:38.758214
241330ad-279c-4854-bdd7-2f2bea0c6e58	2025-11-21	withdrawal-osko payment 1996590 ziad abdulhabeeb personal refund in 4 weeks	50000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 13:15:56.432593	2026-01-02 13:15:56.432593
bbaf676e-f1a2-4ef0-b656-ffcd5de89721	2025-11-11	Ziad labor	45000	expense	1585ae15-8217-40f9-81d9-de856f31e4dc	2026-01-02 12:34:58.348162	2026-01-02 12:34:58.348162
d07343f1-9031-5ad4-a21d-946b57c276d7	2025-12-12	debit card purchase apple.com/bill sydney aus	1599	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.032305	2026-01-02 12:35:01.032305
cdb73bc9-6080-5b03-bd69-87a0aaab9029	2025-12-12	debit card purchase kmart 1399 merrylands aus	8550	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-02 12:35:01.036443	2026-01-02 12:35:01.036443
a084a9cb-d972-5d5d-b174-032a4ef15a71	2026-01-19	EFTPOS DEBIT 0136890 OFFICEWORKS 0272 AUBURN        19/01 Card No. ~054253	200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
64ff8812-40e9-5bab-8e47-b873860f85fd	2026-01-19	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	1311	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
75ac822c-307d-5caf-9504-80c6bca1b707	2026-01-19	DEBIT CARD PURCHASE COSTCO GAS AUBURN LIDCOMBE     AUS Card No. ~054253	12000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
c40c6935-1f5c-5e75-8a36-bfa50ed0cc46	2026-01-19	EFTPOS DEBIT 0211182 hipages tradiecore\\             17/01 Card No. ~054253	76890	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
a70f9e7d-f299-5719-8a08-ac5924b2ea66	2026-01-15	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	950	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
f41a413b-66cd-531b-a356-f695d05a89af	2026-01-15	WITHDRAWAL MOBILE 1554500 PYMT Starr Part House&Workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
182f1dac-a225-51c6-871a-bed3ab651163	2026-01-15	WITHDRAWAL-OSKO PAYMENT 1079064 A AL-MATARI	110000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
0a070441-504f-51f6-9018-651df8439141	2026-01-14	DEBIT CARD PURCHASE BUNNINGS 548000 SMITHFIELD   AUS Card No. ~054253	49410	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
3d36ce25-d9e5-5ec4-a553-57443776d33b	2026-01-13	DEPOSIT-OSKO PAYMENT 2032261 HASHED AHMED MOHAMMED ABDULGHANI Deposit Refund	1500000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
04fce938-a672-5062-bbaf-31cf2315e6dc	2026-01-13	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	1599	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
7befa57a-87e4-5c47-a931-f9c4e4b76518	2026-01-12	DEBIT CARD PURCHASE 7-ELEVEN 2011 GUILDFORD WE AUS Card No. ~054253	400	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
1ca03bae-0b57-5e06-8ba8-b7c8911c6608	2026-01-12	DEBIT CARD PURCHASE 7-ELEVEN 2011 GUILDFORD WE AUS Card No. ~054253	550	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
e0413120-7093-591b-8c59-1f2184d6fa8a	2026-01-12	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	3050	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
f2309bf6-2071-5da3-a142-dccd9a46760f	2026-01-12	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	5999	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
83698fb2-04cd-545d-a02d-6463aec43610	2026-01-12	DEBIT CARD PURCHASE COSTCO GAS AUBURN LIDCOMBE     AUS Card No. ~054253	11594	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
a9ed7ccc-d198-55e8-aa38-8ffcc86fc75d	2026-01-12	EFTPOS DEBIT 0000796 ALL METAL CURVING  \\ ST HUBERTS ISLA 12/01 Card No. ~054253	107800	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
35030aac-d5fd-57df-a90c-e124b597f6e2	2026-01-12	WITHDRAWAL-OSKO PAYMENT 1494335 Hashed Abdulghani Deposit 10 JAN 2026	1500000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
e2715c8e-f116-5911-b643-c81a87370132	2026-01-09	DEBIT CARD PURCHASE 7-ELEVEN 2171 SOUTH HURSTV AUS Card No. ~054253	1550	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
c1302bd0-22c1-5893-9121-9c4c047c7bb2	2026-01-09	DEBIT CARD PURCHASE KFC Miranda Miranda      AUS Card No. ~054253	3835	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
5d97f632-0ec7-503e-ad0f-35c962021fd4	2026-01-09	WITHDRAWAL-OSKO PAYMENT 1677585 A AL-MATARI Salary	100000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
7f519fc3-1540-55a0-88d2-efb054680c29	2026-01-08	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	2050	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
2231935d-ba67-515b-a6e1-706367bec13b	2026-01-08	DEBIT CARD PURCHASE 7-ELEVEN 2171 SOUTH HURSTV AUS Card No. ~054253	2100	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
7ad94a19-e85f-59e9-9e4e-167d6bce5581	2026-01-08	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	2299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
f5259c47-437f-5ccc-820c-f2e523c995ac	2026-01-08	DEBIT CARD PURCHASE KFC Menai              Menai        AUS Card No. ~054253	3690	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
a225606c-18d7-56cf-88fe-ec3d5e99c74d	2026-01-08	WITHDRAWAL MOBILE 1513061 PYMT Starr Part House&Workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
c3a43958-1c4e-5afc-aa51-6fe13b7b2f2e	2026-01-08	WITHDRAWAL-OSKO PAYMENT 1618357 AHMED HASAN AHMED  AL-HAMED Personal loan to be deducted from a	500000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
8ed28247-6b8d-58a5-9ddc-751507580dbd	2026-01-07	DEPOSIT-OSKO PAYMENT 2030785 MR MATTHEW NAPIER DONNELLY Windows and doors 10  deposit Donnelly project	235400	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
54a18a63-f9fa-5046-85bb-50e333c4f5f8	2026-01-07	DEPOSIT D AND S BUILT PT        CaringbahSouth 196	3003000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
367da866-26ae-5172-a5f2-04e2c8cea425	2026-01-07	EFTPOS DEBIT 0178827 BP EXP GYMEA 0860  \\ GYMEA          06/01 Card No. ~054253	2218	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
436f50c0-79e7-586f-ac6b-f1cef7a1a855	2026-01-07	WITHDRAWAL-OSKO PAYMENT 1992882 Mr top Group Pty Ltd Third deposit for 12 Saunders bay r	1500000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
0c447b59-c323-5b6d-9e0c-1cf7ce2cacea	2026-01-06	DEBIT CARD REFUND EZI*BIZ COVER (NO.3) SYDNEY       AUS Card No. ~054253	19079	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
7fab5b74-b968-5340-89fc-078563c71b8c	2026-01-06	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	533	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
a3451ae9-73c1-583e-bb3f-038ec1c4def6	2026-01-06	DEBIT CARD PURCHASE EZI*BIZ COVER (NO.3) SYDNEY       AUS Card No. ~054253	9634	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
a1423af7-1883-5f91-aae9-76e8e9b3d4c6	2026-01-06	DEBIT CARD PURCHASE EZI*BIZ COVER (NO.3) SYDNEY       AUS Card No. ~054253	19079	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
462bb13f-5542-5aff-9c5c-1e639003c64d	2026-01-06	PAYMENT BY AUTHORITY TO Oz Education Gui A00L170705P9	48105	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
977fb18a-8617-534c-ab6c-a5c565b80810	2026-01-05	DEPOSIT 2923649 O'Neill J G & Breese P E Inv#195	176000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
ffedd62f-0dd6-5628-af81-ce60423cb49d	2026-01-05	DEBIT CARD PURCHASE APPLE.COM/BILL SYDNEY       AUS Card No. ~054253	3299	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
16df58d9-0a63-5e5b-8fe4-62571040dd02	2026-01-05	DEBIT CARD PURCHASE COSTCO AUBURN LIDCOMBE     AUS Card No. ~054253	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
8e185ab9-6c39-5c5a-ab58-67e6a618fc23	2026-01-05	WITHDRAWAL-OSKO PAYMENT 1893875 Kim sammut Refund	85000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
75afcfab-42ce-5e0d-96be-8adfe7a8a5cf	2026-01-02	EFTPOS DEBIT 0246880 Shell Reddy Express LiLiverpool     02/01 Card No. ~054253	200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
e0a9280f-3f45-5ff8-b778-44c0209e1dcc	2026-01-02	DEBIT CARD PURCHASE BUNNINGS 548000 SMITHFIELD   AUS Card No. ~054253	651	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
19780e9b-8dc2-5442-9560-cb70b77bce91	2026-01-02	WITHDRAWAL-OSKO PAYMENT 1074961 A AL-MATARI	51000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
59d1e5d7-6564-5d7f-ab9e-a64953f52cd4	2026-01-02	WITHDRAWAL-OSKO PAYMENT 1089810 A AL-MATARI	51000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
e8eece58-f86c-5c04-ba2f-c821a6d6434a	2026-01-02	WITHDRAWAL MOBILE 1430063 PYMT Starr Part House&Workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
fef9684e-1973-58d0-be04-01833120c00d	2026-01-02	WITHDRAWAL-OSKO PAYMENT 1645941 A AL-MATARI 01 JAN 2026	135000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
610a1fe1-0bb3-5db8-87c0-d3c36847ccb4	2025-12-31	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	4670	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
e0b77a7b-1811-5fb3-a636-ff9777a07ffb	2025-12-30	DEBIT CARD REFUND BUDGET DIRECT          TOOWONG     AUS Card No. ~054253	23488	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
17eb21c4-c20e-56b5-b63a-54894992c8f9	2025-12-30	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	688	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
1df6b3b6-718f-59cc-8a1b-d28d7c649b53	2025-12-30	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	1170	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
2e47f09e-0408-5e7e-aa92-5bf2b5082eac	2025-12-30	EFTPOS DEBIT 0026237 ZLR*Lindas Discount ChChester Hill  30/12 Card No. ~054253	7701	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
0a3e3515-f87a-5feb-887b-f15399b28ff3	2025-12-29	EFTPOS DEBIT 0441093 SQ *OLIVER BROWN AUB URAuburn        25/12 Card No. ~054253	1326	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
0c776423-5433-5631-93f4-d433871da05f	2025-12-29	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	5326	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
47719a45-ae45-54a9-b3a6-ba6bf6538f10	2025-12-29	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	6075	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
394adefb-8330-5cb9-9de3-5ed2e82fcc01	2025-12-29	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	7119	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
9af8ec64-5399-5ffb-bcb0-9148a1e8cbf8	2025-12-29	WITHDRAWAL-OSKO PAYMENT 1466181 A AL-MATARI 25 DEC 2025	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
ac16a756-8003-550a-8537-570aec1fe68a	2025-12-29	WITHDRAWAL-OSKO PAYMENT 1648483 A AL-MATARI 25 DEC 2025	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
ba4b0f52-476e-5b3e-9d24-f2acace3b6a1	2025-12-29	EFTPOS DEBIT 0133692 SPEEDWAY WOODPARK WOODPARK      28/12 Card No. ~054253	11232	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
2d02608b-a70b-5851-9caf-5d197cce2e12	2025-12-29	DEBIT CARD PURCHASE BUNNINGS 548000 SMITHFIELD   AUS Card No. ~054253	20046	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
6a699814-286b-5f80-b671-e3f450902015	2025-12-29	WITHDRAWAL-OSKO PAYMENT 1949917 A AL-MATARI 26 DEC 2025	50000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
8ffce5cb-bac2-5018-9a0f-bebe0df8d626	2025-12-29	WITHDRAWAL MOBILE 1570414 PYMT Starr Part House&Workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
e2df4bc8-15ab-5b94-8183-ec75516e0cfe	2025-12-23	EFTPOS DEBIT 0142167 SYD TOOLS SMITHFIELD Smithfield    23/12 Card No. ~054253	2000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
ed230462-f703-59e1-b0a8-234b5b2980de	2025-12-23	DEBIT CARD PURCHASE AMPOL LILLI 22453F LILLI PILLI  AUS Card No. ~054253	2230	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
5805dd70-23d1-58b5-bdf7-d86b2d90a954	2025-12-23	PAYMENT BY AUTHORITY TO Oz Education Gui A00KYB5L05AA	40105	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
53ce6af2-fddf-5dd7-abaa-6fe893aab3c9	2025-12-22	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	684	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
40518606-dc0f-5405-87bc-fe4d583e2a4b	2025-12-22	DEBIT CARD PURCHASE ABUSALIMG      L1036 GUILDFORD    AUS Card No. ~054253	916	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
5e4edbde-c1d1-5fe5-a8d6-f1b434b7c59e	2025-12-22	DEBIT CARD PURCHASE NOUR FRESH PRODUCE PTY GUILDFORD    AUS Card No. ~054253	967	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
9f011a25-7ce1-5997-984f-37e51938f1d1	2025-12-22	DEBIT CARD PURCHASE ABUSALIMG      L1036 GUILDFORD    AUS Card No. ~054253	1309	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
bb061042-bc9f-5697-b012-44fe8c2691ef	2025-12-22	EFTPOS DEBIT 0260444 SQ *YEMEN GATE RESTA URLakemba       22/12 Card No. ~054253	1518	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
7cfc2195-95c2-59e1-aeb2-675a9f4c90e3	2025-12-22	DEBIT CARD PURCHASE WOOLWORTHS      1145 FAIRFIELD    AUS Card No. ~054253	1800	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
13425715-0e90-5d31-8ce6-d4accf653eb4	2025-12-22	EFTPOS DEBIT 0562308 DJM GOBRAN SERVICES PTFAIRFIELD     21/12 Card No. ~054253	4048	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
38b4d651-97f4-5cdf-9a72-2fdd071f9575	2025-12-22	DEBIT CARD PURCHASE COSTCO AUBURN LIDCOMBE     AUS Card No. ~054253	10000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
16666569-2c9c-5a09-a512-745c5fe83e6c	2025-12-22	DEBIT CARD PURCHASE SUPER CHEAP AUTO PTY GUILDFORD    AUS Card No. ~054253	14608	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
1082e9f4-d96b-5abb-93f8-2e266ddcdb81	2025-12-22	DEBIT CARD PURCHASE COSTCO WHOLESALE PTY LIDCOMBE     AUS Card No. ~054253	38673	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
6c8ae65b-86a0-50b9-bccf-d7501b1df2f7	2025-12-22	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	40051	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
8ed02b00-8848-5878-95d6-3dd5c23c4aa5	2025-12-22	WITHDRAWAL-OSKO PAYMENT 1104459 A AL-MATARI	220000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
bc6d9b0b-e91a-5316-982b-1be1d097b448	2025-12-19	DEPOSIT D AND S BUILT PT        SaundersBay INV192	3003000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
4b4f3d79-3d08-5788-873c-ff3775ec7a1d	2025-12-19	DEBIT CARD PURCHASE ISSA PIZZA Padstow      AUS Card No. ~054253	509	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
ab9a3464-9059-5121-804b-4babfffd6ec5	2025-12-19	DEBIT CARD PURCHASE ISSA PIZZA Padstow      AUS Card No. ~054253	1934	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
1e3c7899-9db4-59ba-a032-b50f613269d0	2025-12-19	EFTPOS DEBIT 0206468 El Jannah Chester Hi l Chester Hill  19/12 Card No. ~054253	4200	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
f7043d6d-b086-5b2f-9964-6ef15346fe9f	2025-12-19	DEBIT CARD PURCHASE YT ALUMINIUM AUSTRALIA MILPERRA     AUS Card No. ~054253	5676	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
8b64a8eb-2cf0-50de-8d4d-ec103e17c2df	2025-12-19	DEBIT CARD PURCHASE 7-ELEVEN 2238 SUTHERLAND   AUS Card No. ~054253	7129	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
cf37aa48-7651-5123-82ed-399d2c06c88c	2025-12-19	WITHDRAWAL-OSKO PAYMENT 1553970 Mr top Group Pty Ltd 12 Saunders Bay Road South Caringba	1500000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
091cfd35-0221-5796-8a62-bfafe2065dce	2025-12-18	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	2370	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
ec541075-ea3b-5d90-8ca7-21982c64c74d	2025-12-18	WITHDRAWAL MOBILE 1472737 PYMT Starr Part House&Workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
f07d72ea-3b99-5a92-988d-9c86fb2b460e	2025-12-17	DEBIT CARD PURCHASE LINKT SYDNEY SYDNEY       AUS Card No. ~054253	5018	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
5f16f9a6-e1bc-5ec3-8f93-ed7dd18db52d	2025-12-17	DEBIT CARD PURCHASE DNH*GODADDY#3971146187 SYDNEY       AUS Card No. ~054253	5940	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
6289852e-2d3d-57d2-a41f-6df4f6a71eee	2025-12-17	EFTPOS DEBIT 0127186 Sydney Tools Silverwater   17/12 Card No. ~054253	22800	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
18296135-e013-5f26-8edd-724ee1723d54	2025-12-17	DEBIT CARD PURCHASE BUDGET DIRECT TOOWONG      AUS Card No. ~054253	23488	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
459d4a84-dd75-5b6e-a779-8e7bbb112524	2025-12-17	DEBIT CARD PURCHASE hipages tradiecore Sydney       AUS Card No. ~054253	76890	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
4744fd1f-8b39-53d2-8c36-4b21cf358a69	2025-12-16	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	57716	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
1c7b4fc0-c117-59fc-9780-666e103a1ea5	2025-12-15	DEPOSIT-OSKO PAYMENT 2194791 Auzzy Projects Invoice #190	108900	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
9bf0628a-90e4-555f-a47f-030ef7dafc89	2025-12-15	DEBIT CARD PURCHASE KFC Mt Druitt Mall     Mt Druitt Ma AUS Card No. ~054253	4015	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
82b98c39-b92f-59f4-b829-47f70678273e	2025-12-15	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	4772	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 08:53:30.785869	2026-01-21 08:53:30.785869
5a692964-27a5-5b36-8ab3-0174c5b83c32	2026-01-20	DEBIT CARD REFUND BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	12900	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 21:02:32.915494	2026-01-21 21:02:32.915494
49d95ca3-943d-5228-afe9-6ab0553d25f8	2026-01-20	DEPOSIT-OSKO PAYMENT 2913204 MOHAMMED BA HUTAIR Other	300000	income	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 21:02:32.915494	2026-01-21 21:02:32.915494
8084f0f3-21f6-560e-99b7-4c934ad5ab88	2026-01-20	EFTPOS DEBIT 0020410 UNITED RYDALMERE   \\ RYDALMERE       19/01 Card No. ~054253	795	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 21:02:32.915494	2026-01-21 21:02:32.915494
ea656dba-48ad-5e8b-b186-88cbe9010188	2026-01-20	PAYMENT BY AUTHORITY TO Oz Education Gui A00L5E2Y05X4	48105	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 21:02:32.915494	2026-01-21 21:02:32.915494
85d3722a-c469-50e6-a236-6e992988e9ab	2026-01-20	WITHDRAWAL-OSKO PAYMENT 1908947 Mr top Group Pty Ltd Payment for the job Caringbah	1300000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-21 21:02:32.915494	2026-01-21 21:02:32.915494
9273fcff-9b8f-596f-aea3-87d68fc1745d	2026-01-21	EFTPOS DEBIT 0270687 SHELL REDDY EXPRESS SOHurstville So 21/01 Card No. ~054253	250	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-22 00:30:52.853347	2026-01-22 00:30:52.853347
f20952a8-5840-53eb-a010-03e87e6e9521	2026-01-21	DEBIT CARD PURCHASE AMPOL PADSTOW 22887QPS PADSTOW      AUS Card No. ~054253	1475	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-22 00:30:52.853347	2026-01-22 00:30:52.853347
1cfbbb31-994d-5840-ac09-aa298e0989dc	2026-01-22	DEBIT CARD PURCHASE BUNNINGS GROUP LTD HAWTHORN EAS AUS Card No. ~054253	13236	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-22 22:51:55.917679	2026-01-22 22:51:55.917679
0b075136-14ec-5b27-83b5-fded0b64f192	2026-01-22	WITHDRAWAL MOBILE 1455304 PYMT Starr Part House&Workshop ren	70000	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-22 22:51:55.917679	2026-01-22 22:51:55.917679
0c0dd12e-2907-5b21-a38b-392259ec17f0	2026-01-23	DEBIT CARD PURCHASE YT ALUMINIUM AUSTRALIA MILPERRA     AUS Card No. ~054253	5192	expense	ea82608a-ebcb-4c9a-9bdd-8f265fa5ac6d	2026-01-23 23:37:50.408687	2026-01-23 23:37:50.408687
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, email_verified, image, created_at, updated_at) FROM stdin;
3NX2lECU7OVtmknBHeYAiJmwNOPN2ROf	Admin	admin@aluverse.com.au	f	\N	2025-11-21 09:13:17.575	2025-11-21 09:13:17.575
\.


--
-- Data for Name: verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verifications (id, identifier, value, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 21, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: reconciliations reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_pkey PRIMARY KEY (id);


--
-- Name: financial_accounts financial_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.financial_accounts
    ADD CONSTRAINT financial_accounts_pkey PRIMARY KEY (id);


--
-- Name: loan_payoffs loan_payoffs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payoffs
    ADD CONSTRAINT loan_payoffs_pkey PRIMARY KEY (id);


--
-- Name: loans loans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_pkey PRIMARY KEY (id);


--
-- Name: project_labors project_labors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_labors
    ADD CONSTRAINT project_labors_pkey PRIMARY KEY (id);


--
-- Name: project_misc project_misc_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_misc
    ADD CONSTRAINT project_misc_pkey PRIMARY KEY (id);


--
-- Name: project_payments project_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_payments
    ADD CONSTRAINT project_payments_pkey PRIMARY KEY (id);


--
-- Name: project_supplies project_supplies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_supplies
    ADD CONSTRAINT project_supplies_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_unique UNIQUE (token);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verifications verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verifications
    ADD CONSTRAINT verifications_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reconciliations reconciliations_loan_id_loans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_loan_id_loans_id_fk FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE SET NULL;


--
-- Name: reconciliations reconciliations_loan_payoff_id_loan_payoffs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_loan_payoff_id_loan_payoffs_id_fk FOREIGN KEY (loan_payoff_id) REFERENCES public.loan_payoffs(id) ON DELETE SET NULL;


--
-- Name: reconciliations reconciliations_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: reconciliations reconciliations_transaction_id_transactions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliations
    ADD CONSTRAINT reconciliations_transaction_id_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE CASCADE;


--
-- Name: loan_payoffs loan_payoffs_reconciliation_id_reconciliations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payoffs
    ADD CONSTRAINT loan_payoffs_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id) ON DELETE SET NULL;


--
-- Name: loan_payoffs loan_payoffs_loan_id_loans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loan_payoffs
    ADD CONSTRAINT loan_payoffs_loan_id_loans_id_fk FOREIGN KEY (loan_id) REFERENCES public.loans(id) ON DELETE CASCADE;


--
-- Name: loans loans_reconciliation_id_reconciliations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.loans
    ADD CONSTRAINT loans_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id) ON DELETE SET NULL;


--
-- Name: project_labors project_labors_reconciliation_id_reconciliations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_labors
    ADD CONSTRAINT project_labors_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id) ON DELETE SET NULL;


--
-- Name: project_labors project_labors_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_labors
    ADD CONSTRAINT project_labors_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_misc project_misc_reconciliation_id_reconciliations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_misc
    ADD CONSTRAINT project_misc_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id) ON DELETE SET NULL;


--
-- Name: project_misc project_misc_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_misc
    ADD CONSTRAINT project_misc_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_payments project_payments_reconciliation_id_reconciliations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_payments
    ADD CONSTRAINT project_payments_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id) ON DELETE SET NULL;


--
-- Name: project_payments project_payments_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_payments
    ADD CONSTRAINT project_payments_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_supplies project_supplies_reconciliation_id_reconciliations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_supplies
    ADD CONSTRAINT project_supplies_reconciliation_id_reconciliations_id_fk FOREIGN KEY (reconciliation_id) REFERENCES public.reconciliations(id) ON DELETE SET NULL;


--
-- Name: project_supplies project_supplies_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.project_supplies
    ADD CONSTRAINT project_supplies_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_account_id_financial_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_financial_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.financial_accounts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict zhbhy2mJF1UALqvUfznKOttFiFcLA8O3glsoSdzhD1ZpSf3bSQD3vPOFAHugcxJ

