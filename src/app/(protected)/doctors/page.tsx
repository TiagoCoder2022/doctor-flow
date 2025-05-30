import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderActions,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";

const DoctorsPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Médicos</PageTitle>
          <PageDescription>Gerencie os médicos da sua clínica</PageDescription>
        </PageHeaderContent>
        <PageHeaderActions>
          <Button>
            <PlusIcon />
            Adicionar médico
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <PageContent>
        <h1>Médicos</h1>
      </PageContent>
    </PageContainer>
  );
};

export default DoctorsPage;
