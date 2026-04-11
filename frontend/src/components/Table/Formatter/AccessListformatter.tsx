import type { AccessList, ProxyLocation } from "src/api/backend";
import { intl } from "src/locale";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

interface Props {
	access?: AccessList[];
	type?: ProxyLocation["accessListType"];
	locations?: ProxyLocation[];
}
export function AccessListFormatter({ access = [], type = "public", locations = [] }: Props) {
	const customLocationCount = locations.filter((loc) => loc.accessListType === "custom" && (loc.accessListIds || []).length > 0,).length;
	const hasLocationAcls = customLocationCount > 0;
	let triggerLabel = type === "custom" ? intl.formatMessage({ id: "access-list.custom" }) : intl.formatMessage({ id: "access-list.public" });
	triggerLabel = hasLocationAcls ? `${triggerLabel} <${intl.formatMessage({ id: "column.location" })}>` : triggerLabel;

	if (access.length === 0 && !hasLocationAcls) {
		return <span>{triggerLabel}</span>;
	}

	const popover = (
		<Popover id="access-list-popover">
			<Popover.Body>
				{access.map((acl) => (
					<div key={acl.id}>{acl.name}</div>
				))}
				{hasLocationAcls ?
					<div>{intl.formatMessage({ id: "column.location" })}: {customLocationCount}</div> : null}
			</Popover.Body>
		</Popover>
	);

	return (
		<OverlayTrigger trigger={["hover", "focus"]} placement="bottom" overlay={popover}>
			<button type="button" className="btn btn-action btn-sm px-1">
				{triggerLabel}
			</button>
		</OverlayTrigger>
	);
}
