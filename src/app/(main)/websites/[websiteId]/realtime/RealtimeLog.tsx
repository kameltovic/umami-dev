import { Column, Heading, Row, SearchField, Text } from '@umami/react-zen';
import { type ReactNode, useMemo, useState } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { SessionModal } from '@/app/(main)/websites/[websiteId]/sessions/SessionModal';
import { Avatar } from '@/components/common/Avatar';
import { Empty } from '@/components/common/Empty';
import { IconLabel } from '@/components/common/IconLabel';
import Link from '@/components/common/Link';
import {
  useCountryNames,
  useLocale,
  useMessages,
  useMobile,
  useNavigation,
  useTimezone,
  useWebsite,
} from '@/components/hooks';
import { useFormat } from '@/components/hooks/useFormat';
import { Eye, User } from '@/components/icons';
import { FilterButtons } from '@/components/input/FilterButtons';
import { Lightning } from '@/components/svg';
import { BROWSERS, OS_NAMES } from '@/lib/constants';
import { isGoogle, isLocalHost, ORIGIN_COLORS } from '@/lib/origin';

const TYPE_ALL = 'all';
const TYPE_PAGEVIEW = 'pageview';
const TYPE_SESSION = 'session';
const TYPE_EVENT = 'event';
const MAX_LIST_HEIGHT = 500;
const ROW_HEIGHT = 50;

export const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" width="16" height="16" aria-label="Google" role="img">
    <path
      fill="#EA4335"
      d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.3 13.6 17.7 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"
    />
    <path
      fill="#FBBC05"
      d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.8-6z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"
    />
  </svg>
);

const Badge = ({ children, color }: { children: ReactNode; color: string }) => (
  <span
    style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '1px 6px',
      borderRadius: 999,
      color: '#fff',
      background: color,
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

const icons = {
  [TYPE_PAGEVIEW]: <Eye />,
  [TYPE_SESSION]: <User />,
  [TYPE_EVENT]: <Lightning />,
};

export function RealtimeLog({ data }: { data: any }) {
  const website = useWebsite();
  const [search, setSearch] = useState('');
  const { t, labels, messages } = useMessages();
  const { formatValue } = useFormat();
  const { locale } = useLocale();
  const { formatTimezoneDate } = useTimezone();
  const { countryNames } = useCountryNames(locale);
  const [filter, setFilter] = useState(TYPE_ALL);
  const { updateParams } = useNavigation();
  const { isPhone } = useMobile();

  const buttons = [
    {
      label: t(labels.all),
      id: TYPE_ALL,
    },
    {
      label: t(labels.views),
      id: TYPE_PAGEVIEW,
    },
    {
      label: t(labels.visitors),
      id: TYPE_SESSION,
    },
    {
      label: t(labels.events),
      id: TYPE_EVENT,
    },
  ];

  const getTime = ({ createdAt, firstAt }) => formatTimezoneDate(firstAt || createdAt, 'pp');

  const getIcon = ({ __type }) => icons[__type];

  const getDetail = (log: {
    __type: string;
    eventName: string;
    urlPath: string;
    browser: string;
    os: string;
    country: string;
    device: string;
    hostname: string;
  }) => {
    const { __type, eventName, urlPath, browser, os, country, device, hostname } = log;

    if (__type === TYPE_EVENT) {
      return t.rich(messages.eventLog, {
        event: eventName || t(labels.unknown),
        url: urlPath,
        b: chunks => <b>{chunks}</b>,
        a: chunks => (
          <a
            href={`//${hostname}${urlPath}`}
            style={{ fontWeight: 'bold' }}
            target="_blank"
            rel="noreferrer noopener"
          >
            {chunks}
          </a>
        ),
      });
    }

    if (__type === TYPE_PAGEVIEW) {
      return (
        <a
          href={`//${hostname}${urlPath}`}
          style={{ fontWeight: 'bold' }}
          target="_blank"
          rel="noreferrer noopener"
        >
          {urlPath}
        </a>
      );
    }

    if (__type === TYPE_SESSION) {
      return t.rich(messages.visitorLog, {
        country: countryNames[country] || t(labels.unknown),
        browser: BROWSERS[browser],
        os: OS_NAMES[os] || os,
        device: t(labels[device] || labels.unknown),
        b: chunks => <b>{chunks}</b>,
      });
    }
  };

  const TableRow = ({ index, style, logs }: RowComponentProps<{ logs: any[] }>) => {
    const row = logs[index];
    const local = isLocalHost(row.hostname);
    return (
      <Row
        alignItems="center"
        style={{
          ...style,
          minWidth: 0,
          ...(local && {
            background: 'rgba(245, 158, 11, 0.12)',
            boxShadow: 'inset 3px 0 #f59e0b',
          }),
          ...(!local && row.isOwner && { boxShadow: `inset 3px 0 ${ORIGIN_COLORS.you}` }),
        }}
        gap
      >
        <Row minWidth="30px">
          <Link href={updateParams({ session: row.sessionId })}>
            <Avatar seed={row.sessionId} size={32} />
          </Link>
        </Row>
        <Row minWidth="100px">
          <Text wrap="nowrap">{getTime(row)}</Text>
        </Row>
        <IconLabel icon={getIcon(row)} style={{ minWidth: 0, flex: 1 }}>
          <Text truncate>{getDetail(row)}</Text>
        </IconLabel>
        <Row gap="2" alignItems="center" paddingRight="2">
          {isGoogle(row.referrerDomain) && <GoogleIcon />}
          {local && <Badge color={ORIGIN_COLORS.local}>{row.hostname}</Badge>}
          {row.isOwner && <Badge color={ORIGIN_COLORS.you}>you</Badge>}
        </Row>
      </Row>
    );
  };

  const logs = useMemo(() => {
    if (!data) {
      return [];
    }

    let logs = data.events;

    if (search) {
      logs = logs.filter(({ eventName, urlPath, browser, os, country, device }) => {
        return [
          eventName,
          urlPath,
          os,
          formatValue(browser, 'browser'),
          formatValue(country, 'country'),
          formatValue(device, 'device'),
        ]
          .filter(n => n)
          .map(n => n.toLowerCase())
          .join('')
          .includes(search.toLowerCase());
      });
    }

    if (filter !== TYPE_ALL) {
      return logs.filter(({ __type }) => __type === filter);
    }

    return logs;
  }, [data, filter, formatValue, search]);

  const listHeight = Math.min(logs.length * ROW_HEIGHT, MAX_LIST_HEIGHT);

  return (
    <Column gap="3">
      <Heading size="base">{t(labels.activity)}</Heading>
      {isPhone ? (
        <>
          <Row marginBottom="1">
            <SearchField
              value={search}
              onSearch={setSearch}
              placeholder={t(labels.search)}
              className="w-full max-w-md"
            />
          </Row>
          <Row>
            <FilterButtons items={buttons} value={filter} onChange={setFilter} />
          </Row>
        </>
      ) : (
        <Row alignItems="center" justifyContent="space-between" gap="4">
          <SearchField
            value={search}
            onSearch={setSearch}
            placeholder={t(labels.search)}
            className="w-full max-w-md"
          />
          <FilterButtons items={buttons} value={filter} onChange={setFilter} />
        </Row>
      )}

      <Column gap="3">
        {logs?.length === 0 && <Empty />}
        {logs.length > 0 && (
          <List
            rowComponent={TableRow}
            rowCount={logs.length}
            rowHeight={ROW_HEIGHT}
            rowProps={{ logs }}
            defaultHeight={listHeight}
            style={{ width: '100%', height: listHeight }}
          />
        )}
      </Column>
      <SessionModal websiteId={website.id} />
    </Column>
  );
}
