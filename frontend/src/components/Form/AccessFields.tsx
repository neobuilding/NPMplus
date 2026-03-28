// import { IconSettings } from "@tabler/icons-react";
import { IconLock, IconLockOpen2 } from "@tabler/icons-react";
// import CodeEditor from "@uiw/react-textarea-code-editor";
import cn from "classnames";
// import { Field, useFormikContext } from "formik";
import { useState } from "react";
import type { AccessList, ProxyLocation, ProxyHost } from "src/api/backend";
import { formatDateTime, intl, T } from "src/locale";
import styles from "./LocationsFields.module.css";
import type { ReactNode } from "react";
import Select, { /*type ActionMeta,*/ components, type OptionProps } from "react-select";
import { useLocaleState } from "src/context";
import { useAccessLists } from "src/hooks";

interface Props {
	globalAccessLists: AccessList[];
	globalAccessListType: ProxyHost["accessListType"];
	proxyLocations: ProxyLocation[];
	name?: string;
}

interface AccessOption {
	readonly value: number;
	readonly label: string;
	readonly subLabel: string;
	readonly icon: ReactNode;
}

const Option = (props: OptionProps<AccessOption>) => {
	return (
		<components.Option {...props}>
			<div className="flex-fill">
				<div className="font-weight-medium">
					{props.data.icon} <strong>{props.data.label}</strong>
				</div>
				<div className="text-secondary mt-1 ps-3">{props.data.subLabel}</div>
			</div>
		</components.Option>
	);
};

export function AccessFields({ globalAccessLists, globalAccessListType, proxyLocations/*, name = "access-lists", label = "access-list", id = "accessListId"*/ }: Props) {
	const [globalAccessListValues/*, setGlobalAccessListValues*/] = useState<AccessList[]>(globalAccessLists || []);
	proxyLocations.length == 0;
	// const [locationAccessListValues, setLocationAccessListValues] = useState<ProxyLocation[]>(proxyLocations || []);
	// const { setFieldValue } = useFormikContext();

	const { locale } = useLocaleState();
	const { isLoading, isError, error, data } = useAccessLists(["owner", "items", "clients"]);

	// const handleChange = (newValue: any, _actionMeta: ActionMeta<AccessOption>) => {
	// 	setFieldValue(name, newValue?.value);
	// };

	const options: AccessOption[] =
		data?.map((item: AccessList) => ({
			value: item.id || 0,
			label: item.name,
			subLabel: intl.formatMessage(
				{ id: "access-list.subtitle" },
				{
					users: item?.items?.length,
					rules: item?.clients?.length,
					date: item?.createdOn ? formatDateTime(item?.createdOn, locale) : "N/A",
				},
			),
			icon: <IconLock size={14} className="text-lime" />,
		})) || [];

	// Public option
	const publicOption = {
		value: 0,
		label: intl.formatMessage({ id: "access-list.public" }),
		subLabel: intl.formatMessage({ id: "access-list.public.subtitle" }),
		icon: <IconLockOpen2 size={14} className="text-red" />,
	};
	options?.unshift(publicOption);



	// const handleOptionChanged = (newValue: any, _actionMeta: ActionMeta<AccessOption>) => {
	// }

	const isOptionDisabled = (selectedOptions: AccessList[]): boolean => {
		const used = new Set(selectedOptions?.map((item: AccessList) => (item.id || 0)) || []);
		return used.has(publicOption.value);
	}

	const findFirstAvailableOption = (selectedOptions: AccessList[]) : AccessOption | undefined => {
		const used = new Set(selectedOptions?.map((item: AccessList) => (item.id || 0)) || []);
		for (const opt of options) {
			if (!used.has(opt.value)) {
				return opt; // first available in order
			}
		}
	}

	// const handleLocationAccessListAdd = () => {
	// 	if(locationAccessListValues.length == 0) {

	// 	}
	// 	const defaultOption = findFirstAvailableOption();

	// 	setLocationAccessListValues([...locationAccessListValues, blankItem]);
	// };
	const handleAdd = () => {

	}
	const handleChange = (idx: number, field: string, fieldValue: any) => {
		idx = idx;
		field = field;
		fieldValue = fieldValue;

	}
	// const handleAddGlobalAccessListValues = () => {
	// 	if (globalAccessListValues.length < options.length) {
	// 		const defaultOption = findFirstAvailableOption(globalAccessListValues);
	// 		setGlobalAccessListValues([...globalAccessListValues, defaultOption]);
	// 	}
	// };


	// const handleRemove = (idx: number) => {
	// 	const newValues = values.filter((_: ProxyLocation, i: number) => i !== idx);
	// 	setValues(newValues);
	// 	setFormField(newValues);
	// };

	// const setFormField = (newValues: ProxyLocation[]) => {
	// 	const filtered = newValues.filter((v: ProxyLocation) => v?.path?.trim() !== "");
	// 	setFieldValue(name, filtered);
	// };

	if (globalAccessListValues.length === 0) {
		return (
			<div className="text-center">
				<button type="button" className="btn my-3" onClick={handleAdd}>
					<T id="action.add-location" />
				</button>
			</div>
		);
	}

	const globalIdx : number = -1;
	return (
		<>
			<div key={globalIdx} className={cn("card", "card-active", "mb-3", styles.locationCard)}>
				<div className="card-body">
					<div className="row">
						<div className="col-md-10">
							<div className="input-group mb-3">
								<span className="input-group-text">{intl.formatMessage({ id: "access-list.global" })}</span>
								<select
									id="accessControlType"
									className="form-select w-auto flex-grow-0"
									value={globalAccessListType ? globalAccessListType : "public"}
									onChange={(e) => handleChange(globalIdx, "accessControlType", e.target.value)}
								>
									<option value="public">{intl.formatMessage({ id: "access-list.public" })}</option>
									<option value="custom">{intl.formatMessage({ id: "access-list.custom" })}</option>
								</select>
							</div>
						</div>
					</div>
					<div className="row mb-1">
						{isLoading ? <div className="placeholder placeholder-lg col-12 my-3 placeholder-glow" /> : null}
						{isError ? <div className="invalid-feedback">{`${error}`}</div> : null}
						{!isLoading && !isError ? (
							<Select
								className="react-select-container"
								classNamePrefix="react-select"
								defaultValue={findFirstAvailableOption(globalAccessListValues)}
								options={options}
								components={{ Option }}
								styles={{
									option: (base) => ({
										...base,
										height: "100%",
									}),
								}}
								//  onChange={handleGlobalAccessListValues}
								isDisabled={isOptionDisabled(globalAccessListValues)}
							/>
						) : null}
						
					</div>
					<div>
						<button type="button" className="btn btn-sm" onClick={handleAdd}>
							<T id="action.add-access-list" />
						</button>
					</div>
					<div className="mt-1">
						<a
							href="#"
							// onClick={(e) => {
							// 	e.preventDefault();
							// 	handleRemove(globalIdx);
							// }}
						>
						<T id="action.delete" />
						</a>
					</div>
				</div>
			</div>
			{/* {values.map((item: ProxyLocation, idx: number) => (
				<div key={idx} className={cn("card", "card-active", "mb-3", styles.locationCard)}>
					<div className="card-body">
						<div className="row">
							<div className="col-md-10">
								<div className="input-group mb-3">
									<span className="input-group-text">Location</span>
									<span className="input-group-text">item.path</span>
									<select
										id="locationType"
										className="form-select w-auto flex-grow-0"
										value={item.locationType}
										onChange={(e) => handleChange(idx, "locationType", e.target.value)}
									>
										<option value="public">{intl.formatMessage({ id: "access-list.public" })}</option>
										<option value="global">{intl.formatMessage({ id: "access-list.global" })}</option>
										<option value="custom">{intl.formatMessage({ id: "access-list.custom" })}</option>
									</select>
								</div>
							</div>
						</div>
						<div className="row mb-1">
							{isLoading ? <div className="placeholder placeholder-lg col-12 my-3 placeholder-glow" /> : null}
							{isError ? <div className="invalid-feedback">{`${error}`}</div> : null}
							{!isLoading && !isError ? (
								<Select
									className="react-select-container"
									classNamePrefix="react-select"
									defaultValue={options.find((o) => o.value === field.value) || options[0]}
									options={options}
									components={{ Option }}
									styles={{
										option: (base) => ({
											...base,
											height: "100%",
										}),
									}}
									onChange={handleOptionChanged}
								/>
							) : null}
							{form.errors[field.name] ? (
								<div className="invalid-feedback">
									{form.errors[field.name] && form.touched[field.name] ? form.errors[field.name] : null}
								</div>
							) : null}
						</div>
						<div className="mt-1">
							<a
								href="#"
								onClick={(e) => {
									e.preventDefault();
									handleRemove(idx);
								}}
							>
								<T id="action.delete" />
							</a>
						</div>
					</div>
				</div>
			))} */}
			
		</>
	);
}
