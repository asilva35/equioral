import React, { useEffect } from 'react';

import {
  Input,
  Image,
  Select,
  SelectItem,
  Button,
  Textarea,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Chip,
  Link,
} from '@nextui-org/react';

import styles from '@/styles/dashboard/notifications/DetailNotification.module.css';

import { formatDate } from '@/utils/utils';

export default function DetailNotification(props) {
  const { userRole, record, markAsReaded } = props;

  //console.log(record);
  //const newRecord = { ...record };
  const formatValue = (key, type) => {
    if (!record) return '';
    const value = record[key];
    if (type == 'date') {
      return formatDate(value);
    } else {
      return value;
    }
  };

  const flag = React.useRef(false);

  useEffect(() => {
    if (flag.current) return;
    flag.current = true;
    markAsReaded();
  }, [record]);

  const statusColorMap = {
    active: 'primary',
    pending: 'warning',
    close: 'default',
  };
  const statusLabelMap = {
    active: 'Activo',
    pending: 'Pendiente',
    close: 'Cerrado',
  };

  let link = '';

  if (record.object === 'orders') {
    link = `/dashboard/orders/detail/${record.objectid}`;
  } else if (record.object === 'tickets') {
    link = `/dashboard/tickets/`;
  }

  return (
    <>
      <Card className="max-w-[400px]">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className={`${styles.title}`}>{record.title}</p>
            <p className={`${styles.subtitle}`}>
              {formatValue('createdAt', 'date')}
            </p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <p className={`${styles.message}`}>{record.message}</p>
        </CardBody>
        <Divider />
        <CardFooter>
          <Link href={link}>Ver acá</Link>
        </CardFooter>
      </Card>
    </>
  );
}
