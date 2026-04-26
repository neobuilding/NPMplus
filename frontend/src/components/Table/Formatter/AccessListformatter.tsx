import type { AccessList, ProxyLocation } from "src/api/backend";
import { intl } from "src/locale";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

interface Props {
	access?: AccessList[];
	type?: ProxyLocation["npmplusAccessListType"];
	locations?: ProxyLocation[];
}
export function AccessListFormatter({ access = [], type = "public", locations = [] }: Props) {
	const hasLocationAcls = locations.filter((loc) => loc.npmplusAccessListType === "custom" && (loc.npmplusAccessListIds || []).length > 0).length > 0;

	let triggerLabel = type === "custom" ? intl.formatMessage({ id: "access-list.custom" }) : intl.formatMessage({ id: "access-list.public" });

	if (access.length === 0) {
		return <span>{triggerLabel}</span>;
	}
	if (access.length === 1) {
		return hasLocationAcls ? (
			<span><strong>{access[0].name}</strong></span>
		) : (
			<span>{access[0].name}</span>
		);
	}
	const popover = (
		<Popover id="access-list-popover">
			<Popover.Body>
				{access.map((acl) => (
					<div key={acl.id}>{acl.name}</div>
				))}
			</Popover.Body>
		</Popover>
	);

	return (
		<OverlayTrigger trigger={["hover", "focus"]} placement="bottom" overlay={popover}>
			<button type="button" className="btn btn-link p-0 border-0 text-decoration-none align-baseline" aria-label={triggerLabel}>
				{hasLocationAcls ?<strong>{triggerLabel}</strong> : triggerLabel} 
			</button> 
		</OverlayTrigger>
	);
}
