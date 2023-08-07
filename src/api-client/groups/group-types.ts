export interface Group {
    _id: string;
    name: string;
    path: string;
    parentId: string;
    hasChildren: boolean;
    members: number;
    hideInProfile: boolean;
    isOrgGroup?: boolean;
}

export interface GroupDto {
    name: string;
    path: string;
    parentId: string;
    hasChildren: boolean;
    members: number;
    hideInProfile: boolean;
    isOrgGroup?: boolean;
}

export interface AbcGroup extends GroupDto, Document {}
